'use client';

import { useState } from 'react';
import { changeUsername } from '@/lib/api';
import { changePassword } from '@/lib/api'; // Assuming you have this function implemented
import { changeEmail } from '@/lib/api'; // Assuming you have this function implemented

export default function SettingsPage() {
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleForm = (formName: string) => {
    setOpenForm(openForm === formName ? null : formName);
    setMessage(null); // clear message when toggling
  };

  async function handleSubmitChangeUser(event: React.FormEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('username') as HTMLInputElement;
    const newUsername = input.value.trim();

    if (!newUsername) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }

    try {
      const res = await changeUsername(newUsername);
      setMessage({ type: 'success', text: res.message || 'Username changed successfully!' });
      setOpenForm(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change username.' });
    }
  }
  async function handleSubmitChangePassword(event: React.FormEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: 'Both fields are required.' });
      return;
    }
    try {
      const res = await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: res.message || 'Password changed successfully!' });
      setOpenForm(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    }
  }
  async function handleSubmitChangeEmail(event: React.FormEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('email') as HTMLInputElement;
    const newEmail = input.value.trim();
    if (!newEmail) {
      setMessage({ type: 'error', text: 'Email cannot be empty.' });
      return;
    }
    try {
      const res = await changeEmail(newEmail);
      setMessage({ type: 'success', text: res.message || 'Email changed successfully!' });
      setOpenForm(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change email.' });
    }
  }

  return (
    <div className="flex w-full min-h-screen justify-center items-start pt-20 bg-gray-100">
      <div className="flex flex-col p-10 gap-y-4 bg-white shadow-lg rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-3 rounded-xl text-center ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Change Username */}
        <div>
          <div
            className="cursor-pointer px-5 py-3 bg-black text-white rounded-2xl text-center"
            onClick={() => toggleForm('username')}
          >
            Change Username
          </div>
          {openForm === 'username' && (
            <form
              className="mt-3 flex flex-col gap-3"
              onSubmit={handleSubmitChangeUser}
            >
              <input
                type="text"
                name="username"
                placeholder="New Username"
                className="p-3 rounded-xl border border-gray-300"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
              >
                Save Username
              </button>
            </form>
          )}
        </div>

        {/* Change Email (unchanged) */}
        <div>
          <div
            className="cursor-pointer px-5 py-3 bg-black text-white rounded-2xl text-center"
            onClick={() => toggleForm('email')}
          >
            Change Email
          </div>
          {openForm === 'email' && (
            <form 
              className="mt-3 flex flex-col gap-3"
              onSubmit={handleSubmitChangeEmail}
            >
              <input
                type="email"
                name="email"
                placeholder="New Email"
                className="p-3 rounded-xl border border-gray-300"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
              >
                Save Email
              </button>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div>
          <div
            className="cursor-pointer px-5 py-3 bg-black text-white rounded-2xl text-center"
            onClick={() => toggleForm('password')}
          >
            Change Password
          </div>
          {openForm === 'password' && (
            <form 
              className="mt-3 flex flex-col gap-3"
              onSubmit={handleSubmitChangePassword}>
              <input
                type="password"
                name="currentPassword"
                placeholder="Current Password"
                className="p-3 rounded-xl border border-gray-300"
              />

              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                className="p-3 rounded-xl border border-gray-300"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
              >
                Save Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );  
}
