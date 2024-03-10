import { computed, ref, type Component } from 'vue';
import { useCloned } from '@vueuse/core';
import { diff } from '@/utils/diff';
import { Notify } from 'quasar';

type NotNull<T> = T extends null ? never : T;

interface FormOptions {
	validationErrorNotification: (ref: Component) => void;
}

const DefaultFormOptions: Readonly<FormOptions> = {
	validationErrorNotification: () => {
		Notify.create({
			message: 'Některá pole ve formuláři obsahují neplatné hodnoty',
			color: 'negative',
		});
	},
};

export function useForm<T extends object | null>(initialState: T, options = DefaultFormOptions) {
	const serverData = ref<T>(initialState);
	const { cloned: localData } = useCloned(serverData);

	const dirtyProps = computed<Partial<NotNull<T>>>(() => {
		if (!serverData.value || !localData.value) return {};
		return diff(serverData.value, localData.value);
	});

	const isDirty = computed(() => Object.keys(dirtyProps.value).length > 0);

	return {
		serverData,
		localData,
		dirtyProps,
		isDirty,
		validationErrorNotification: options.validationErrorNotification,
	};
}
