import { useLoginWithSms } from '@privy-io/react-auth';

export function usePhoneLogin() {
  const { sendCode, loginWithCode } = useLoginWithSms();

  return {
    sendCode: (phone: string) => sendCode({ phoneNumber: phone }),
    loginWithCode: (code: string, _phone: string) => loginWithCode({ code }),
  };
}
