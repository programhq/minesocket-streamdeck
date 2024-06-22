/// <reference path="../../libs/js/property-inspector.js" />
/// <reference path="../../libs/js/utils.js" />

$PI.onConnected((event) => {
  const actionSettings = event.actionInfo.payload.settings;
  const form = document.getElementById('action-form');

  Utils.setFormValue(actionSettings, form);

  form.addEventListener('input', 
    Utils.debounce(150, (event) => {
      if (!event.target) return;
      
      const data = Utils.getFormValue(form);

      $PI.setSettings(data);
    })
  );
});
