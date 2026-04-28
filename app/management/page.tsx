import ProfileForm from '@/components/forms/ProfileForm'
import FoodNutritionTable from '@/components/nutrition/FoodNutritionTable'
import DietHistoryTable from '@/components/nutrition/DietHistoryTable'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">数据管理</h1>

        <div className="grid gap-8">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">一、个人信息记录</h2>
            <p className="text-gray-600 mb-6">输入您的身高体重等信息，用于计算每日营养摄入目标</p>
            <ProfileForm />
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">二、营养成分表库</h2>
            <p className="text-gray-600 mb-6">
              上传营养成分表图片，AI 自动识别并填入数据。也可以手动添加食物信息。
            </p>
            <FoodNutritionTable />
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <DietHistoryTable />
          </section>
        </div>
      </div>
    </div>
  )
}
