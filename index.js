import { resolve } from 'path';
import serverRoutes from './server/routes/server';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'kbn_dashmenu_management',
    uiExports: {

      app: {
        title: 'Menu manager',
        description: 'Custom Dashboard menu manager Plugin',
        main: 'plugins/kbn_dashmenu_management/app',
        icon: 'plugins/kbn_dashmenu_management/icon.svg'
      },

    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },


    init(server, options) {
      server.log(['status', 'info', 'kbn_dashmenu_management'], 'kbn_dashmenu_management Initializing...');
      // Add server routes and initalize the plugin here
      serverRoutes(server);
    }


  });
}
