// Helix OS Virtual X11 & GUI Display Server Engine
// Enables Python (Tkinter, PySimpleGUI, Turtle, WebGUI) & Shell (Zenity, Dialog, XMessage) to run native GUI windows in Helix DE.

export type WidgetType = 
  | 'label' 
  | 'button' 
  | 'entry' 
  | 'slider' 
  | 'checkbox' 
  | 'textarea' 
  | 'progress' 
  | 'canvas' 
  | 'dialog' 
  | 'webview' 
  | 'separator'
  | 'row';

export interface CanvasCommand {
  type: 'line' | 'rect' | 'circle' | 'text' | 'clear' | 'turtle_step';
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  color?: string;
  width?: number;
  text?: string;
  fill?: boolean;
}

export interface GuiWidget {
  id: string;
  type: WidgetType;
  label?: string;
  text?: string;
  value?: any;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  color?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
  action?: string;
  actionCode?: string;
  children?: GuiWidget[];
}

export interface ZenityDialogConfig {
  type: 'info' | 'warning' | 'error' | 'question' | 'entry' | 'progress' | 'file';
  title: string;
  text: string;
  entryDefault?: string;
  percentage?: number;
  okLabel?: string;
  cancelLabel?: string;
}

export type DisplayMode = 'auto-fit' | 'fluid-flow' | 'mobile-touch' | 'native';

export interface GuiWindowDescriptor {
  id: string;
  title: string;
  width: number;
  height: number;
  icon: string;
  sourceType: 'python-tkinter' | 'python-customtkinter' | 'python-pysimplegui' | 'python-pyqt' | 'python-turtle' | 'python-helix' | 'python-webview' | 'zenity' | 'xmessage' | 'generic';
  sourceCode: string;
  widgets: GuiWidget[];
  state: Record<string, any>;
  canvasCommands: CanvasCommand[];
  dialogConfig?: ZenityDialogConfig;
  displayMode: DisplayMode;
  scaleRatio: number;
  logs: string[];
  lastUpdated: number;
  status: 'running' | 'closed';
}

export type GuiServerListener = (windows: GuiWindowDescriptor[]) => void;

export class GuiDisplayServer {
  private static instance: GuiDisplayServer;
  private windows: Map<string, GuiWindowDescriptor> = new Map();
  private listeners: Set<GuiServerListener> = new Set();
  private windowManagerRef: any = null;

  public displayId = ':0.0';
  public protocolVersion = 'Helix-X11/Wayland-v3.2';
  public isRunning = true;
  public totalClientsSpawned = 0;

  private constructor() {
    // Singleton
  }

  public static get(): GuiDisplayServer {
    if (!GuiDisplayServer.instance) {
      GuiDisplayServer.instance = new GuiDisplayServer();
    }
    return GuiDisplayServer.instance;
  }

  public setWindowManager(wm: any) {
    this.windowManagerRef = wm;
  }

  public subscribe(fn: GuiServerListener): () => void {
    this.listeners.add(fn);
    fn(Array.from(this.windows.values()));
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const list = Array.from(this.windows.values());
    this.listeners.forEach(fn => {
      try {
        fn(list);
      } catch (err) {
        console.error('GuiServer listener error:', err);
      }
    });
  }

  public getWindow(id: string): GuiWindowDescriptor | undefined {
    return this.windows.get(id);
  }

  public getAllWindows(): GuiWindowDescriptor[] {
    return Array.from(this.windows.values());
  }

  public closeWindow(id: string) {
    const win = this.windows.get(id);
    if (win) {
      win.status = 'closed';
      this.windows.delete(id);
      this.notify();
    }
  }

  /**
   * Registers a GUI window and triggers creation in WindowManager.
   */
  public registerAndLaunchWindow(desc: Omit<GuiWindowDescriptor, 'lastUpdated' | 'status' | 'displayMode' | 'scaleRatio'> & Partial<Pick<GuiWindowDescriptor, 'displayMode' | 'scaleRatio'>>): string {
    const fullDesc: GuiWindowDescriptor = {
      displayMode: 'auto-fit',
      scaleRatio: 1.0,
      ...desc,
      lastUpdated: Date.now(),
      status: 'running'
    };

    this.windows.set(fullDesc.id, fullDesc);
    this.totalClientsSpawned++;
    this.notify();

    if (this.windowManagerRef) {
      this.windowManagerRef.launch('gui-window', {
        guiId: fullDesc.id,
        title: fullDesc.title,
        width: fullDesc.width,
        height: fullDesc.height,
        icon: fullDesc.icon,
        multiInstance: true
      });
    }

    return fullDesc.id;
  }

  public setDisplayMode(windowId: string, mode: DisplayMode) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.displayMode = mode;
    win.logs.push(`[CONVERSION] Display mode switched to '${mode}'`);
    win.lastUpdated = Date.now();
    this.notify();
  }

  public setScaleRatio(windowId: string, ratio: number) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.scaleRatio = Math.max(0.5, Math.min(2.0, ratio));
    win.logs.push(`[CONVERSION] Scale ratio updated to ${Math.round(win.scaleRatio * 100)}%`);
    win.lastUpdated = Date.now();
    this.notify();
  }

  /**
   * Updates state of a widget (e.g. text input, slider)
   */
  public updateWidgetValue(windowId: string, widgetId: string, value: any) {
    const win = this.windows.get(windowId);
    if (!win) return;

    win.state[widgetId] = value;

    // Search and update widget tree
    const updateRecursive = (widgets: GuiWidget[]) => {
      for (const w of widgets) {
        if (w.id === widgetId) {
          w.value = value;
        }
        if (w.children) {
          updateRecursive(w.children);
        }
      }
    };
    updateRecursive(win.widgets);

    win.lastUpdated = Date.now();
    this.notify();
  }

  /**
   * Handles user interaction with a widget action (button clicks, form submits)
   */
  public triggerWidgetAction(windowId: string, widgetId: string) {
    const win = this.windows.get(windowId);
    if (!win) return;

    const findWidget = (widgets: GuiWidget[]): GuiWidget | null => {
      for (const w of widgets) {
        if (w.id === widgetId) return w;
        if (w.children) {
          const found = findWidget(w.children);
          if (found) return found;
        }
      }
      return null;
    };

    const target = findWidget(win.widgets);
    if (!target) return;

    win.logs.push(`[EVENT] Action triggered on widget '${target.label || target.id}'`);

    // Handle standard action triggers
    if (target.actionCode) {
      this.executeActionScript(win, target.actionCode);
    } else if (target.action) {
      this.handleNamedAction(win, target.action);
    }

    win.lastUpdated = Date.now();
    this.notify();
  }

  private handleNamedAction(win: GuiWindowDescriptor, action: string) {
    switch (action) {
      case 'counter_increment': {
        const cur = Number(win.state['counter'] || 0) + 1;
        win.state['counter'] = cur;
        win.logs.push(`Counter updated: ${cur}`);
        this.updateWidgetValue(win.id, 'counter_lbl', `Current Count: ${cur}`);
        break;
      }
      case 'counter_decrement': {
        const cur = Number(win.state['counter'] || 0) - 1;
        win.state['counter'] = cur;
        win.logs.push(`Counter updated: ${cur}`);
        this.updateWidgetValue(win.id, 'counter_lbl', `Current Count: ${cur}`);
        break;
      }
      case 'counter_reset': {
        win.state['counter'] = 0;
        win.logs.push(`Counter reset to 0`);
        this.updateWidgetValue(win.id, 'counter_lbl', `Current Count: 0`);
        break;
      }
      case 'clear_log': {
        win.logs = [];
        break;
      }
      case 'calculate': {
        try {
          const num1 = parseFloat(win.state['num1'] || '0');
          const num2 = parseFloat(win.state['num2'] || '0');
          const op = win.state['op'] || '+';
          let res = 0;
          if (op === '+') res = num1 + num2;
          else if (op === '-') res = num1 - num2;
          else if (op === '*') res = num1 * num2;
          else if (op === '/') res = num2 !== 0 ? num1 / num2 : NaN;
          win.state['calc_result'] = isNaN(res) ? 'Error: Div by 0' : String(res);
          this.updateWidgetValue(win.id, 'result_lbl', `Result: ${win.state['calc_result']}`);
          win.logs.push(`Calculated: ${num1} ${op} ${num2} = ${win.state['calc_result']}`);
        } catch {
          win.logs.push('Calculation error');
        }
        break;
      }
      case 'clear_canvas': {
        win.canvasCommands = [{ type: 'clear' }];
        win.logs.push('Canvas cleared');
        break;
      }
      case 'draw_random_shapes': {
        const colors = ['#6ee7b7', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa'];
        for (let i = 0; i < 5; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          const x = Math.floor(Math.random() * (win.width - 60)) + 20;
          const y = Math.floor(Math.random() * 180) + 20;
          const rad = Math.floor(Math.random() * 25) + 10;
          win.canvasCommands.push({
            type: 'circle',
            x,
            y,
            radius: rad,
            color,
            fill: true
          });
        }
        win.logs.push('Drew 5 random shapes onto Canvas');
        break;
      }
      default:
        win.logs.push(`Action executed: ${action}`);
        break;
    }
  }

  private executeActionScript(win: GuiWindowDescriptor, script: string) {
    try {
      // Execute in sandboxed state scope
      const context = {
        state: win.state,
        logs: win.logs,
        set: (k: string, v: any) => {
          win.state[k] = v;
          this.updateWidgetValue(win.id, k, v);
        },
        log: (msg: string) => win.logs.push(String(msg)),
        toast: (msg: string) => win.logs.push(`[TOAST] ${msg}`)
      };
      const fn = new Function('ctx', `with(ctx) { ${script} }`);
      fn(context);
    } catch (err: any) {
      win.logs.push(`[ERROR] Script failure: ${err.message}`);
    }
  }

  /**
   * Main Python GUI code parser and runner.
   * Recognizes Tkinter, PySimpleGUI, Turtle graphics, WebGUI, and custom Helix GUI scripts.
   */
  public parseAndLaunchPython(code: string, fileName = 'python_gui.py'): { success: boolean; windowId?: string; logs: string[] } {
    const logs: string[] = [];
    logs.push(`[Helix-X11] Launching Python GUI runtime with DISPLAY=${this.displayId}`);
    logs.push(`[Helix-X11] Parsing file: ${fileName}`);

    const id = `gui-py-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let title = fileName.replace(/\.py$/, '') + ' (Python GUI)';
    let width = 480;
    let height = 400;
    let icon = '🐍';
    let sourceType: GuiWindowDescriptor['sourceType'] = 'python-tkinter';
    const widgets: GuiWidget[] = [];
    const state: Record<string, any> = {};
    const canvasCommands: CanvasCommand[] = [];

    // Analyze imports
    const isTurtle = code.includes('import turtle') || code.includes('from turtle import');
    const isTkinter = code.includes('tkinter') || code.includes('tk.');
    const isWebview = code.includes('import webview') || code.includes('webview.');
    const isPySimple = code.includes('PySimpleGUI') || code.includes('psg.');

    // 1. TURTLE GRAPHICS PARSER
    if (isTurtle) {
      sourceType = 'python-turtle';
      icon = '🐢';
      title = 'Python Turtle Graphics Canvas';
      width = 520;
      height = 460;

      // Extract title and geometry if available
      const titleMatch = code.match(/turtle\.title\(["'](.*?)["']\)/);
      if (titleMatch) title = titleMatch[1];

      // Parse turtle steps
      const steps: CanvasCommand[] = [{ type: 'clear' }];
      let curX = 260;
      let curY = 200;
      let curAngle = 0; // degrees, 0 = right
      let isPenDown = true;
      let curColor = '#6ee7b7';
      let curWidth = 2;

      const lines = code.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        // color
        const colorMatch = line.match(/(?:t\.|turtle\.)color\(["'](.*?)["']\)/);
        if (colorMatch) curColor = colorMatch[1];

        // width / pensize
        const widthMatch = line.match(/(?:t\.|turtle\.)(?:width|pensize)\((\d+)\)/);
        if (widthMatch) curWidth = parseInt(widthMatch[1], 10);

        // penup / pendown
        if (line.includes('penup()') || line.includes('up()')) isPenDown = false;
        if (line.includes('pendown()') || line.includes('down()')) isPenDown = true;

        // forward / fd
        const fdMatch = line.match(/(?:t\.|turtle\.)(?:forward|fd)\((\d+(?:\.\d+)?)\)/);
        if (fdMatch) {
          const dist = parseFloat(fdMatch[1]);
          const rad = (curAngle * Math.PI) / 180;
          const nextX = curX + dist * Math.cos(rad);
          const nextY = curY + dist * Math.sin(rad);

          if (isPenDown) {
            steps.push({
              type: 'line',
              x: curX,
              y: curY,
              x2: nextX,
              y2: nextY,
              color: curColor,
              width: curWidth
            });
          }
          curX = nextX;
          curY = nextY;
        }

        // right / rt
        const rtMatch = line.match(/(?:t\.|turtle\.)(?:right|rt)\((\d+(?:\.\d+)?)\)/);
        if (rtMatch) curAngle = (curAngle + parseFloat(rtMatch[1])) % 360;

        // left / lt
        const ltMatch = line.match(/(?:t\.|turtle\.)(?:left|lt)\((\d+(?:\.\d+)?)\)/);
        if (ltMatch) curAngle = (curAngle - parseFloat(ltMatch[1]) + 360) % 360;

        // circle
        const circleMatch = line.match(/(?:t\.|turtle\.)circle\((\d+(?:\.\d+)?)\)/);
        if (circleMatch) {
          const r = parseFloat(circleMatch[1]);
          steps.push({
            type: 'circle',
            x: curX,
            y: curY,
            radius: r,
            color: curColor,
            width: curWidth,
            fill: false
          });
        }
      }

      // If no steps parsed or simple script, add default spirograph art
      if (steps.length <= 1) {
        // Generate an elegant procedural spirograph
        for (let i = 0; i < 36; i++) {
          const a = (i * 10 * Math.PI) / 180;
          steps.push({
            type: 'circle',
            x: 260 + 50 * Math.cos(a),
            y: 190 + 50 * Math.sin(a),
            radius: 60,
            color: i % 2 === 0 ? '#6ee7b7' : '#38bdf8',
            width: 1.5,
            fill: false
          });
        }
      }

      canvasCommands.push(...steps);

      widgets.push({
        id: 'turtle_canvas',
        type: 'canvas',
        min: 520,
        max: 320
      });

      widgets.push({
        id: 'controls_row',
        type: 'row',
        children: [
          {
            id: 'btn_clear',
            type: 'button',
            label: 'Clear Canvas',
            variant: 'secondary',
            action: 'clear_canvas'
          },
          {
            id: 'btn_draw',
            type: 'button',
            label: 'Random Shapes',
            variant: 'primary',
            action: 'draw_random_shapes'
          }
        ]
      });
    } 
    // 2. WEBVIEW / HTML PARSER
    else if (isWebview) {
      sourceType = 'python-webview';
      icon = '🌐';
      title = 'Python WebGUI Window';
      width = 560;
      height = 420;

      const titleMatch = code.match(/create_window\(["'](.*?)["']/);
      if (titleMatch) title = titleMatch[1];

      let htmlContent = '<div style="padding: 24px; font-family: sans-serif; color: #fff; text-align: center;"><h2>Python Webview Running</h2><p>Helix WebGUI rendering engine active.</p></div>';
      const htmlMatch = code.match(/html\s*=\s*"""([\s\S]*?)"""/) || code.match(/html\s*=\s*'''([\s\S]*?)'''/);
      if (htmlMatch) htmlContent = htmlMatch[1];

      widgets.push({
        id: 'webview_frame',
        type: 'webview',
        text: htmlContent
      });
    }
    // 3. TKINTER & STANDARD PYTHON GUI PARSER
    else {
      sourceType = 'python-tkinter';
      icon = '🐍';

      // Look for title: root.title("...")
      const titleMatch = code.match(/(?:root|app|window)\.title\(["'](.*?)["']\)/);
      if (titleMatch) title = titleMatch[1];

      // Look for geometry: root.geometry("500x400")
      const geomMatch = code.match(/(?:root|app|window)\.geometry\(["'](\d+)x(\d+)["']\)/);
      if (geomMatch) {
        width = Math.max(340, parseInt(geomMatch[1], 10));
        height = Math.max(280, parseInt(geomMatch[2], 10));
      }

      // Parse lines for Label, Button, Entry, Scale/Slider, Checkbutton, Canvas
      const lines = code.split('\n');
      let widgetCounter = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        // Label: Label(..., text="...")
        if (line.includes('Label(')) {
          widgetCounter++;
          const textMatch = line.match(/text\s*=\s*["'](.*?)["']/);
          const text = textMatch ? textMatch[1] : `Label ${widgetCounter}`;
          const isHeader = line.includes('font=') && (line.includes('bold') || line.includes('16') || line.includes('18'));
          
          widgets.push({
            id: `label_${widgetCounter}`,
            type: 'label',
            text,
            variant: isHeader ? 'primary' : undefined
          });
        }
        // Button: Button(..., text="...", command=...)
        else if (line.includes('Button(')) {
          widgetCounter++;
          const textMatch = line.match(/text\s*=\s*["'](.*?)["']/);
          const cmdMatch = line.match(/command\s*=\s*([a-zA-Z0-9_]+)/);
          const label = textMatch ? textMatch[1] : `Button ${widgetCounter}`;
          const cmd = cmdMatch ? cmdMatch[1] : `action_${widgetCounter}`;

          // Map known actions
          let actionName = 'button_clicked';
          if (cmd.includes('increment') || cmd.includes('count') || label.includes('+') || label.includes('Increment')) {
            actionName = 'counter_increment';
          } else if (cmd.includes('decrement') || label.includes('-') || label.includes('Decrement')) {
            actionName = 'counter_decrement';
          } else if (cmd.includes('reset') || label.includes('Reset')) {
            actionName = 'counter_reset';
          } else if (cmd.includes('calc') || label.includes('Calculate') || label.includes('Compute')) {
            actionName = 'calculate';
          }

          widgets.push({
            id: `btn_${widgetCounter}`,
            type: 'button',
            label,
            action: actionName,
            variant: label.toLowerCase().includes('delete') || label.toLowerCase().includes('reset') ? 'danger' : 'primary'
          });
        }
        // Entry: Entry(...)
        else if (line.includes('Entry(')) {
          widgetCounter++;
          const placeholderMatch = line.match(/placeholder\s*=\s*["'](.*?)["']/);
          const placeholder = placeholderMatch ? placeholderMatch[1] : 'Enter text...';
          state[`entry_${widgetCounter}`] = '';

          widgets.push({
            id: `entry_${widgetCounter}`,
            type: 'entry',
            placeholder,
            value: ''
          });
        }
        // Scale / Slider: Scale(..., from_=0, to=100)
        else if (line.includes('Scale(') || line.includes('Slider(')) {
          widgetCounter++;
          const fromMatch = line.match(/from_?\s*=\s*(\d+)/);
          const toMatch = line.match(/to\s*=\s*(\d+)/);
          const labelMatch = line.match(/label\s*=\s*["'](.*?)["']/);
          const min = fromMatch ? parseInt(fromMatch[1], 10) : 0;
          const max = toMatch ? parseInt(toMatch[1], 10) : 100;
          const val = Math.floor((min + max) / 2);
          state[`slider_${widgetCounter}`] = val;

          widgets.push({
            id: `slider_${widgetCounter}`,
            type: 'slider',
            label: labelMatch ? labelMatch[1] : `Parameter ${widgetCounter}`,
            min,
            max,
            value: val
          });
        }
        // Checkbutton: Checkbutton(..., text="...")
        else if (line.includes('Checkbutton(')) {
          widgetCounter++;
          const textMatch = line.match(/text\s*=\s*["'](.*?)["']/);
          const text = textMatch ? textMatch[1] : `Toggle Option ${widgetCounter}`;
          state[`check_${widgetCounter}`] = false;

          widgets.push({
            id: `check_${widgetCounter}`,
            type: 'checkbox',
            label: text,
            value: false
          });
        }
      }

      // If no widgets could be parsed, provide a clean default interactive Tkinter GUI
      if (widgets.length === 0) {
        widgets.push(
          {
            id: 'header_lbl',
            type: 'label',
            text: 'Tkinter Python GUI Application',
            variant: 'primary'
          },
          {
            id: 'desc_lbl',
            type: 'label',
            text: 'Connected to Helix X11 Display Server (:0.0)'
          },
          {
            id: 'counter_lbl',
            type: 'label',
            text: 'Current Count: 0'
          },
          {
            id: 'btn_row',
            type: 'row',
            children: [
              {
                id: 'btn_inc',
                type: 'button',
                label: 'Increment (+)',
                variant: 'primary',
                action: 'counter_increment'
              },
              {
                id: 'btn_dec',
                type: 'button',
                label: 'Decrement (-)',
                variant: 'secondary',
                action: 'counter_decrement'
              },
              {
                id: 'btn_rst',
                type: 'button',
                label: 'Reset',
                variant: 'danger',
                action: 'counter_reset'
              }
            ]
          },
          {
            id: 'input_field',
            type: 'entry',
            placeholder: 'Type something to update Python state...'
          }
        );
        state['counter'] = 0;
      }
    }

    const winId = this.registerAndLaunchWindow({
      id,
      title,
      width,
      height,
      icon,
      sourceType,
      sourceCode: code,
      widgets,
      state,
      canvasCommands,
      logs: [
        `[PID ${Math.floor(Math.random() * 4000 + 1000)}] Python 3.11.8 process started.`,
        `X11 window established at 0x${Math.floor(Math.random() * 16777215).toString(16)}.`,
        `Event loop active.`
      ]
    });

    logs.push(`[Helix-X11] Window '${title}' successfully launched into Helix DE (Window ID: ${winId})`);
    return { success: true, windowId: winId, logs };
  }

  /**
   * Shell Zenity / XMessage dialog launcher
   */
  public launchZenityDialog(cliArgs: string[]): { success: boolean; windowId?: string; output: string } {
    let type: ZenityDialogConfig['type'] = 'info';
    let title = 'Helix OS Notification';
    let text = 'Dialog message';
    let entryDefault = '';
    let percentage = 50;

    for (let i = 0; i < cliArgs.length; i++) {
      const arg = cliArgs[i];
      if (arg === '--info') type = 'info';
      else if (arg === '--warning') type = 'warning';
      else if (arg === '--error') type = 'error';
      else if (arg === '--question') type = 'question';
      else if (arg === '--entry') type = 'entry';
      else if (arg === '--progress') type = 'progress';
      else if (arg.startsWith('--title=')) title = arg.slice(8).replace(/^["']|["']$/g, '');
      else if (arg === '--title' && cliArgs[i + 1]) { title = cliArgs[++i].replace(/^["']|["']$/g, ''); }
      else if (arg.startsWith('--text=')) text = arg.slice(7).replace(/^["']|["']$/g, '');
      else if (arg === '--text' && cliArgs[i + 1]) { text = cliArgs[++i].replace(/^["']|["']$/g, ''); }
      else if (arg.startsWith('--entry-text=')) entryDefault = arg.slice(13).replace(/^["']|["']$/g, '');
      else if (arg.startsWith('--percentage=')) percentage = parseInt(arg.slice(13), 10) || 50;
    }

    const id = `zenity-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dialogConfig: ZenityDialogConfig = {
      type,
      title,
      text,
      entryDefault,
      percentage
    };

    const winId = this.registerAndLaunchWindow({
      id,
      title,
      width: 420,
      height: 240,
      icon: type === 'warning' || type === 'error' ? '⚠️' : type === 'question' ? '❓' : '💬',
      sourceType: 'zenity',
      sourceCode: `zenity ${cliArgs.join(' ')}`,
      widgets: [
        {
          id: 'dlg_widget',
          type: 'dialog',
          text
        }
      ],
      state: { inputVal: entryDefault, progress: percentage },
      canvasCommands: [],
      dialogConfig,
      logs: [`Zenity dialog invoked with type '${type}'`]
    });

    return {
      success: true,
      windowId: winId,
      output: `[Zenity] Dialog rendered in Helix DE (PID ${Math.floor(Math.random() * 2000 + 1000)})`
    };
  }

  /**
   * Simple xmessage modal launcher
   */
  public launchXMessage(text: string): { success: boolean; windowId?: string } {
    return this.launchZenityDialog(['--info', '--title=XMessage', `--text=${text}`]);
  }
}
