import { useLoginWithSMS } from '@privy-io/expo';

export function usePhoneLogin() {
  const { sendCode, loginWithCode } = useLoginWithSMS();

  return {
    sendCode: (phone: string) => sendCode({ phone }),
    loginWithCode: (code: string, phone: string) => loginWithCode({ code, phone }),
  };
}
