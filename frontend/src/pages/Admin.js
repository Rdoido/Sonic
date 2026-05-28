import React from 'react';
import { motion } from 'framer-motion';

export default function Admin() {

  const stats = [
    {
      title: 'Usuários',
      value: '12.458',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Depósitos',
      value: 'R$ 87.000',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Saques',
      value: 'R$ 31.000',
      color: 'from-red-500 to-pink-500'
    },
    {
      title: 'Online',
      value: '412',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white p-5">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-black mb-8">
          Painel Administrativo
        </h1>

        <div className="grid grid-cols-2 gap-4">

          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: idx * 0.1
              }}
              className={`bg-gradient-to-br ${item.color} p-[1px] rounded-3xl`}
            >
              <div className="bg-[#0b1220] rounded-3xl p-6 h-full">

                <div className="text-zinc-400 text-sm mb-2">
                  {item.title}
                </div>

                <div className="text-3xl font-black">
                  {item.value}
                </div>

              </div>
            </motion.div>
          ))}

        </div>

        <div className="mt-8 bg-[#0b1220] rounded-3xl p-6 border border-white/5">

          <h2 className="text-2xl font-bold mb-4">
            Estatísticas Gerais
          </h2>

          <div className="space-y-3 text-zinc-300">

            <div className="flex justify-between">
              <span>Total apostado hoje</span>
              <span className="text-green-400 font-bold">
                R$ 187.320
              </span>
            </div>

            <div className="flex justify-between">
              <span>Lucro da casa</span>
              <span className="text-yellow-400 font-bold">
                R$ 41.281
              </span>
            </div>

            <div className="flex justify-between">
              <span>Jogo mais acessado</span>
              <span className="text-cyan-400 font-bold">
                Fortune Rabbit
              </span>
            </div>

            <div className="flex justify-between">
              <span>Novos usuários</span>
              <span className="text-pink-400 font-bold">
                +184 hoje
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
