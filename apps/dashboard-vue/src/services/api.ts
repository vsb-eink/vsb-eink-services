import axios, { type AxiosError, isAxiosError } from 'axios';

import { FACADE_URL } from '@/environment';
import {
	Configuration,
	AuthApiFactory,
	AdminApiFactory,
	HostedApiFactory,
	PanelsApiFactory,
	UsersApiFactory,
	ScheduleApiFactory,
} from '@vsb-eink/facade-api-client';
import { getToken } from '@/composables/user-store';

const axiosInstance = axios.create({
	baseURL: FACADE_URL,
});

const apiConfig = new Configuration({
	accessToken: () => getToken() || '',
});
export const api = {
	auth: AuthApiFactory(apiConfig, undefined, axiosInstance),
	admin: AdminApiFactory(apiConfig, undefined, axiosInstance),
	hosted: HostedApiFactory(apiConfig, undefined, axiosInstance),
	panels: PanelsApiFactory(apiConfig, undefined, axiosInstance),
	users: UsersApiFactory(apiConfig, undefined, axiosInstance),
	schedule: ScheduleApiFactory(apiConfig, undefined, axiosInstance),
};

export const isNotFoundError = (
	error: any,
): error is AxiosError<{ message: string; code: 404 }> => {
	return isAxiosError(error) && error.response?.status === 404;
};

export const isUnauthorizedError = (
	error: any,
): error is AxiosError<{ message: string; code: 401 }> => {
	return isAxiosError(error) && error.response?.status === 401;
};

export const isForbiddenError = (
	error: any,
): error is AxiosError<{ message: string; code: 403 }> => {
	return isAxiosError(error) && error.response?.status === 403;
};
