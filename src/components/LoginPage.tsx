import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Store, ShoppingBag } from 'lucide-react';
export function LoginPage() {
 const [email, setEmail] = useState('admin@shop.com');
 const [password, setPassword] = useState('1234');
 const { login, isLoading } = useApp();
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const success = await login(email, password);
 if (!success) {
 alert('Login failed. Please try again.');
 }
 };
 return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 {/* Logo & Brand */}
 <div className="text-center mb-8">
 <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
 <Store className="w-10 h-10 text-white"/>
 </div>
 <h1 className="text-3xl font-bold text-gray-800">ShopEase</h1>
 <p className="text-gray-500 mt-2">Retail Management System</p>
 </div>

 {/* Login Card */}
 <div className="bg-white rounded-2xl shadow-xl p-8">
 <div className="flex items-center justify-center gap-2 mb-6">
 <ShoppingBag className="w-6 h-6 text-blue-500"/>
 <h2 className="text-xl font-semibold text-gray-700">Login to Your Store</h2>
 </div>
 
 <form onSubmit={handleSubmit} className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">
 Email Address
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
 <User className="w-5 h-5"/>
 </span>
 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700" placeholder="your@email.com"/>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">
 Password
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
 <Lock className="w-5 h-5"/>
 </span>
 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700" placeholder="••••••••"/>
 </div>
 </div>

 <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
 {isLoading ? (<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>) : (<>
 <Lock className="w-5 h-5"/>
 Login to Dashboard
 </>)}
 </button>
 </form>

 <div className="mt-6 p-4 bg-blue-50 rounded-xl">
 <p className="text-sm text-blue-600 text-center">
 <span className="font-semibold">Demo Credentials:</span>
 <br/>
 Email: admin@shop.com | Password: 1234
 </p>
 </div>
 </div>

 {/* Footer */}
 <p className="text-center text-gray-400 text-sm mt-8">
 © 2024 ShopEase. All rights reserved.
 </p>
 </div>
 </div>);
}
