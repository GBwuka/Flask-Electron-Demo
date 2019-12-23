"use strict";

const { app, BrowserWindow } = require("electron"); // app控制应用生命周期的模块，BrowserWindow创建原生浏览器窗口的模块
const path = require("path");
const http = require("http");

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭
let mainWindow = null;
let subpy = null;
let freePort = null;

const PY_DIST_FOLDER = "dist-python"; // python 打包后路径
const PY_SRC_FOLDER = "web_app"; // python 源文件路径
const PY_MODULE = "run_app.py"; // python 启动脚本

//自己写一个sleep函数
function sleep(milliSeconds) {
  var StartTime = new Date().getTime();
  while (new Date().getTime() < StartTime + milliSeconds);
}

function findFreePort() {
  var server = http.createServer();
  server.listen(0);
  server.on('listening', function() {});
  try {
    return server.address().port;
  }
  finally {
    server.close();
  }
}

const isRunningInBundle = () => {
  return require("fs").existsSync(path.join(__dirname, PY_DIST_FOLDER));
};

const getPythonScriptPath = () => {
  if (!isRunningInBundle()) {
    return path.join(__dirname, PY_SRC_FOLDER, PY_MODULE);
  }
  if (process.platform === "win32") {
    return path.join(
      __dirname,
      PY_DIST_FOLDER,
      PY_MODULE.slice(0, -3) + ".exe"
    );
  }
  return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE);
};

const startPythonSubprocess = () => {
  let script = getPythonScriptPath();
  freePort = findFreePort();
  if (isRunningInBundle()) {
    subpy = require("child_process").execFile(script, [freePort]);
  } else {
    subpy = require("child_process").spawn("python", [script, freePort]);
  }
};

const killPythonSubprocesses = main_pid => {
  const python_script_name = path.basename(getPythonScriptPath());
  let cleanup_completed = false;
  const psTree = require("ps-tree");
  psTree(main_pid, function(err, children) {
    let python_pids = children
      .filter(function(el) {
        return el.COMMAND == python_script_name;
      })
      .map(function(p) {
        return p.PID;
      });
    // kill掉所有后台python进程
    python_pids.forEach(function(pid) {
      process.kill(pid);
    });
    subpy = null;
    cleanup_completed = true;
  });
  return new Promise(function(resolve, reject) {
    (function waitForSubProcessCleanup() {
      if (cleanup_completed) return resolve();
      setTimeout(waitForSubProcessCleanup, 30);
    })();
  });
};

const createMainWindow = () => {
  // 创建浏览器窗口。
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // transparent: true,
    // icon: __dirname + "/icon.png",
    // fullscreen: true,
    // opacity: 0.8,
    // darkTheme: true,
    // frame: false,
    resizeable: true
  });

  // 加载应用的 index.html
  mainWindow.loadURL("http://localhost:" + freePort + "/");

  // 打开开发者工具
  mainWindow.webContents.openDevTools();

  // 当 window 被关闭，这个事件会被发出
  mainWindow.on("closed", function() {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 但这次不是。
    mainWindow = null;
  });
};

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
// 这个方法就被调用
app.on("ready", function() {
  // 启动后台python服务
  startPythonSubprocess();
  // 这里sleep 1s是为了让flask充分启动
  sleep(1000);
  // 创建浏览器窗口
  createMainWindow();
});

// 设置菜单栏
app.on("browser-window-created", function(e, window) {
  // window.setMenu(null);
});

// 当所有窗口被关闭了，退出。
app.on("window-all-closed", () => {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  if (process.platform !== "darwin") {
    let main_process_pid = process.pid;
    killPythonSubprocesses(main_process_pid).then(() => {
      app.quit();
    });
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (subpy == null) {
    startPythonSubprocess();
  }
  if (win === null) {
    createWindow();
  }
});

app.on("quit", function() {
  // 其他清理操作
});
