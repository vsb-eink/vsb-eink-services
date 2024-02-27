import axios from 'axios';
import { Notify } from 'quasar';
import { FACADE_URL } from '@/environment';

export const http = axios.create({
	baseURL: FACADE_URL,
});

http.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

http.interceptors.response.use(
	(response) => response,
	(error) => {
		const message = error.response?.data?.message;
		if (message) {
			Notify.create({ message, color: 'negative' });
		}

		return Promise.reject(error);
	},
);
