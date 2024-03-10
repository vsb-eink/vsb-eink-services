import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Dialog, LocalStorage, Meta, Notify, Quasar, Ripple, SessionStorage } from 'quasar';
import quasarCzechLocale from 'quasar/lang/cs';

// fonts
import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
// quasar css
import 'quasar/src/css/index.sass';
import '@quasar/extras/animate/bounceIn.css';
import '@quasar/extras/animate/bounceOut.css';

import App from './App.vue';
import { router } from './router';

const app = createApp(App);

app.use(Quasar, {
	lang: quasarCzechLocale,
	plugins: { Notify, Meta, SessionStorage, LocalStorage, Dialog },
	config: {
		notify: {
			group: false,
			timeout: 1000,
		},
	},
});
app.directive('ripple', Ripple);

app.use(createPinia());
app.use(router);

app.mount('#app');
