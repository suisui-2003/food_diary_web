'use client'

import ProfileForm from '@/components/forms/ProfileForm'
import FoodNutritionTable from '@/components/nutrition/FoodNutritionTable'
import DietHistoryTable from '@/components/nutrition/DietHistoryTable'

export default function ManagementPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="grid gap-6 md:gap-8">
        <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-3 text-white">一、个人信息记录</h2>
          <p className="text-white/60 mb-6">输入您的身高体重等信息，用于计算每日营养摄入目标</p>
          <ProfileForm />
        </section>

        <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-3 text-white">二、营养成分表库</h2>
          <p className="text-white/60 mb-6">
            上传营养成分表图片，AI 自动识别并填入数据。也可以手动添加食物信息。
          </p>
          <FoodNutritionTable />
        </section>

        <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
          <DietHistoryTable />
        </section>
      </div>
    </div>
  )
}
