'use client';

import { useState } from 'react';
import Link from 'next/link';

const PLANS = {
  free: {
    id: 'free',
    name: 'Ucretsiz',
    price: 0,
    features: ['1,000 hafiza', '100 MCP cagrisi/ay', 'Web arayuzu', 'Chrome Extension'],
    popular: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    features: ['100,000 hafiza', '10,000 MCP cagrisi/ay', 'API Erisimi', 'MCP Entegrasyonu', 'Takim (5 uye)', 'Email Destek'],
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: ['Sinirsiz hafiza', 'Sinirsiz MCP', 'Ozel MCP Sunucusu', 'Self-Hosted', 'SLA %99.9', '7/24 Destek'],
    popular: false,
  },
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-white">AI-ULU</span>
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
            Ucretsiz Baslat
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Basit Fiyatlandirma</h1>
        <p className="text-xl text-gray-400">Ihtiyaciniza uygun plani secin</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {Object.values(PLANS).map((plan) => (
            <div key={plan.id} className={`bg-gray-800/50 rounded-2xl p-8 border ${plan.popular ? 'border-purple-500' : 'border-gray-700'}`}>
              {plan.popular && <div className="text-center text-purple-400 text-sm mb-2">En Populer</div>}
              <h3 className="text-xl font-bold text-white text-center mb-2">{plan.name}</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-400">/ay</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`block w-full py-3 rounded-lg font-medium text-center ${plan.popular ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white'}`}>
                {plan.id === 'free' ? 'Ucretsiz Baslat' : 'Plani Sec'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
