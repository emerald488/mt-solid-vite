import { Component, createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useRegister } from '../lib/queries/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RegisterPage: Component = () => {
  const navigate = useNavigate();
  const register = useRegister();

  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!email() || !password() || !confirmPassword()) {
      setError('Заполните все поля');
      return;
    }

    if (password() !== confirmPassword()) {
      setError('Пароли не совпадают');
      return;
    }

    if (password().length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    register.mutate(
      { email: email(), password: password() },
      {
        onSuccess: () => {
          navigate('/', { replace: true });
        },
        onError: (err) => {
          setError(err.message || 'Ошибка регистрации');
        },
      }
    );
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <div class="w-full max-w-md">
        <div class="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
          <div class="mb-8 text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
              Money Tracker
            </h1>
            <p class="mt-2 text-slate-600 dark:text-slate-400">
              Создайте новый аккаунт
            </p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-6">
            <Show when={error()}>
              <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error()}
              </div>
            </Show>

            <Input
              label="Email"
              type="email"
              placeholder="example@mail.com"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              autocomplete="email"
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              autocomplete="new-password"
              hint="Минимум 6 символов"
            />

            <Input
              label="Подтвердите пароль"
              type="password"
              placeholder="••••••••"
              value={confirmPassword()}
              onInput={(e) => setConfirmPassword(e.currentTarget.value)}
              autocomplete="new-password"
            />

            <Button
              type="submit"
              fullWidth
              loading={register.isPending}
            >
              Зарегистрироваться
            </Button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Уже есть аккаунт?{' '}
            <A
              href="/login"
              class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Войти
            </A>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
