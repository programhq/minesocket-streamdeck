/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

// PLUGIN_DATA is initialized and updated by the websocket message event
// PLUGIN_DATA[device][action][context]
let PLUGIN_DATA = {};

$SD.onConnected(() => {
  $SD.websocket.onmessage = (message) => {
    if (!('data' in message)) return;

    const data = JSON.parse(message.data);

    $SD.emit(data.event, data);

    if (!('device' in data)) return;

    if (!(data.device in PLUGIN_DATA)) {
      PLUGIN_DATA[data.device] = {};
    }

    let deviceData = PLUGIN_DATA[data.device];
    
    if (!('context' in data)) {
      for (const key of Object.keys(data)) {
        if (key === 'event' || key === 'device') continue;

        deviceData[key] = data[key];
      }
      return;
    }

    if (!('action' in data && 'payload' in data)) return;

    if (!(data.action in deviceData)) {
      deviceData[data.action] = {};
    }

    let actionData = deviceData[data.action];

    if (!(data.context in actionData)) {
      actionData[data.context] = {};
    }

    let contextData = actionData[data.context];

    for(const key of Object.keys(data.payload)) {
      contextData[key] = data.payload[key];
    }
  };
});

$SD.on('keyUp', (data) => {
  const action = PLUGIN_DATA[data.device][data.action][data.context];

  if (action === undefined)  {
    $SD.showAlert(data.context);
    return;
  };

  // Add action handlers below

  switch (data.action) {
    case 'gg.program.minesocket.command':
      handleCommandAction(data.context, action);
      break;
    default:
      break;
  }
});

function handleCommandAction(context, action) {
  const settings = action.settings;
  const wsUrl = `ws://${settings.serverPort}/`;

  if (action.websocket === undefined || action.websocket.url !== wsUrl) {
    if (action.websocket) action.websocket.close();

    const websocket = new WebSocket(wsUrl);

    websocket.addEventListener('error', () => $SD.showAlert(context));
    websocket.addEventListener('open', () => websocket.send(`auth:${settings.password}`));
    websocket.addEventListener('message', (message) => {
      if (!('data' in message)) return;

      const data = JSON.parse(message.data);

      if ('authorized' in data) {
        if (data.authorized) {
          websocket.send(settings.command);
        } else {
          $SD.showAlert(context);
          websocket.close(1008, "Invalid password");
        }
        return;
      }

      if ('success' in data) {
        data.success ? $SD.showOk(context) : $SD.showAlert(context);
      }
    });
    websocket.addEventListener('close', () => action.websocket = undefined);

    action.websocket = websocket;
  } else {
    action.websocket.send(settings.command);
  }
}