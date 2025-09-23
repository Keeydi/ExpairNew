'use client';

import { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import PasswordResetSuccessDialog from '../../../components/auth/password-reset-success-dialog';
import { useSearchParams } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function ResetPasswordPage() {
  const searchParams = useSearchParams(); 
  const token = searchParams.get('token'); 
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Invalid or missing token.');
      }
      if (!password || !repeatPassword) {
        throw new Error('Please fill in all fields.');
      }
      if (password !== repeatPassword) {
        throw new Error('Passwords do not match.');
      }

      // API call to your Django backend
      const response = await fetch('http://127.0.0.1:8000/api/reset-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password.');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSuccessDialogOpen(true);
    },
    onError: (error) => {
      console.warn('Error:', error.message);
      setErrorMessage(error.message);
    },
  });

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-cover bg-center text-white px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="z-10 flex flex-col items-center space-y-6 text-center max-w-md w-full">
        <img
          src="/assets/logos/Colored=Logo S.png"
          alt="Logo"
          className="h-12 w-auto mb-[20px]"
        />
        <h1 className="font-bold text-[25px] mb-[20px]">Set a new password</h1>
        <p className="text-[16px] text-white/80 mb-[35px]">
          Make sure your password is at least 8 characters with uppercase,
          lowercase, number, and symbol.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMessage('');
            mutation.mutate();
          }}
          className="w-full space-y-4 flex flex-col items-center"
        >
          {/* Password Field */}
          <div className="relative mb-1 w-[400px] max-w-full mb-[35px] ">
            <Input
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 appearance-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Repeat Password Field */}
          <div className="relative mb-1 w-[400px] max-w-full mb-[20px] ">
            <Input
              placeholder="Repeat password"
              type={showRepeatPassword ? 'text' : 'password'}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="pr-10 appearance-none"
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
            >
              {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Error Message */}
          <div className="w-[400px] max-w-full text-left mb-2 min-h-[20px]">
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="flex w-[400px] max-w-full h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>

        <Link
          href="/signin"
          className="text-[#0038FF] hover:underline flex items-center gap-1 text-[20px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {/* Pagination dots */}
        <div className="fixed bottom-[62px] left-0 w-full flex justify-center gap-2 z-10">
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-[#0038FF]" />
        </div>
      </div>

      {/* Success Dialog */}
      <PasswordResetSuccessDialog 
        isOpen={isSuccessDialogOpen} 
        onClose={() => setIsSuccessDialogOpen(false)} 
      />
    </div>
  );
}
