import { Toast } from './Toast';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokensPerSec?: number;
  executionMode?: 'GPU (WebGPU)' | 'WASM (Multithread)' | 'CPU Fallback';
}

export interface AiCopilotStatus {
  isLoaded: boolean;
  modelName: string;
  backend: 'GPU (WebGPU)' | 'WASM (Multithread)' | 'CPU Fallback';
  memoryUsedMb: number;
  speechEnabled: boolean;
  totalPromptsProcessed: number;
}

type AiListener = (status: AiCopilotStatus) => void;

class HelixAiCopilotEngine {
  private isLoaded = false;
  private isProcessing = false;
  private speechEnabled = true;
  private totalPromptsProcessed = 0;
  private listeners: Set<AiListener> = new Set();
  private modelName = 'Helix-TinyLlama-1.1B-Instruct-WASM-GGUF';
  private backend: 'GPU (WebGPU)' | 'WASM (Multithread)' | 'CPU Fallback' = 'GPU (WebGPU)';

  constructor() {
    this.detectHardwareCapabilities();
  }

  private detectHardwareCapabilities() {
    if (typeof window !== 'undefined' && 'gpu' in navigator) {
      this.backend = 'GPU (WebGPU)';
    } else if (typeof window !== 'undefined' && window.crossOriginIsolated) {
      this.backend = 'WASM (Multithread)';
    } else {
      this.backend = 'CPU Fallback';
    }
    this.isLoaded = true;
  }

  public getStatus(): AiCopilotStatus {
    return {
      isLoaded: this.isLoaded,
      modelName: this.modelName,
      backend: this.backend,
      memoryUsedMb: 340, // 340MB VRAM/WASM Heap
      speechEnabled: this.speechEnabled,
      totalPromptsProcessed: this.totalPromptsProcessed,
    };
  }

  public toggleSpeech(): boolean {
    this.speechEnabled = !this.speechEnabled;
    this.notify();
    return this.speechEnabled;
  }

  public speakText(text: string) {
    if (!this.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  public async generateResponse(
    prompt: string,
    onChunk?: (textChunk: string) => void
  ): Promise<string> {
    this.isProcessing = true;
    this.totalPromptsProcessed++;
    this.notify();

    // Local Client-Side Inference Processing Simulation using offline rule transformer logic
    const lower = prompt.toLowerCase();
    let answer = '';

    if (lower.includes('python')) {
      answer = `\`\`\`python
# Local Helix-AI Python Script (100% Client-Side)
import sys
import json
import math

def calculate_system_metrics(data):
    """Processes system metrics locally inside WASM Python runtime."""
    print(f"[INFO] Python Runtime v3.11.4 inside Helix OS VFS")
    summary = {
        "status": "HEALTHY",
        "processed_items": len(data),
        "entropy": math.sin(42) * 100
    }
    return json.dumps(summary, indent=2)

if __name__ == "__main__":
    test_payload = [10, 20, 30, 40, 50]
    result = calculate_system_metrics(test_payload)
    print(result)
\`\`\``;
    } else if (lower.includes('rust')) {
      answer = `\`\`\`rust
// Local Helix-AI Rust WebAssembly Module (100% Client-Side)
use std::slice;

#[no_mangle]
pub extern "C" fn process_memory_buffer(ptr: *const u8, len: usize) -> u32 {
    let data = unsafe { slice::from_raw_parts(ptr, len) };
    let mut hash: u32 = 5381;
    for &byte in data {
        hash = ((hash << 5).wrapping_add(hash)).wrapping_add(byte as u32);
    }
    hash
}

fn main() {
    println!("[RUST-WASM] Compiled cleanly for Helix OS Native Runtime");
}
\`\`\``;
    } else if (lower.includes('script') || lower.includes('bash') || lower.includes('automate')) {
      answer = `\`\`\`bash
#!/bin/bash
# Local Helix-AI Bash Automation Script (100% Client-Side)
echo "=== HELIX OS SYSTEM AUTOMATION DASHBOARD ==="
echo "[INFO] Running automated memory & package maintenance..."
echo "Uptime: $(uptime)"
echo "Active Storage: $(df -h / | tail -n 1)"
echo "Safe Checkpoints: Saved in /var/log/helix/checkpoints.log"
echo "[SUCCESS] Automation run complete. Zero external network calls."
\`\`\``;
    } else if (lower.includes('status') || lower.includes('kernel') || lower.includes('specs')) {
      answer = `Helix OS Kernel v9.5.0 LTS
Backend Execution: ${this.backend}
AI Model: ${this.modelName}
Memory Footprint: 340 MB
Zero-Knowledge Privacy: Enabled (100% Client-Side Local Execution)
Supported Runtimes: Python WASM, Rust/C++ WASM, Linux Alpine 6.6, Wine 9.0, Android Wayland/ART`;
    } else if (lower.includes('theme') || lower.includes('color')) {
      answer = `To customize Helix OS theme colors, open Settings -> "Custom Theme Studio". You can pick primary, secondary, and accent colors for Terminal, Window Headers, and Dock!`;
    } else {
      answer = `[Helix Local Copilot (${this.backend})]
Analyzed request: "${prompt}".
Execution completed 100% on local client hardware with zero external API calls. All code execution and data remain completely private inside your browser container.`;
    }

    // Stream chunks smoothly
    const words = answer.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      if (onChunk) onChunk(current);
      await new Promise((r) => setTimeout(r, 20)); // simulated 45 tokens/sec
    }

    this.isProcessing = false;
    this.notify();

    if (this.speechEnabled) {
      this.speakText(answer);
    }

    return answer;
  }

  public subscribe(cb: AiListener): () => void {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const st = this.getStatus();
    this.listeners.forEach((cb) => cb(st));
  }
}

export const HelixAiCopilot = new HelixAiCopilotEngine();
