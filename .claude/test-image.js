const fs = require('fs')

async function testImage() {
  // 读取图片文件
  const imagePath = 'd:\\software\\weixin\\xwechat_files\\wxid_pk4qeastl7ya12_aed5\\temp\\RWTemp\\2026-04\\9e20f478899dc29eb19741386f9343c8\\bc21b2acef9ea59ffb768cf5212cefc1.jpg'
  const imageBuffer = fs.readFileSync(imagePath)
  const base64 = imageBuffer.toString('base64')

  console.log('Image size:', base64.length, 'characters')
  console.log('Base64 preview:', base64.substring(0, 100) + '...')

  // 调用图片识别API
  const response = await fetch('http://localhost:3000/api/nutrition/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mediaType: 'image/jpeg',
    }),
  })

  console.log('API Response status:', response.status)
  const data = await response.json()
  console.log('API Response data:', JSON.stringify(data, null, 2))

  console.log('\n=== Analysis Results ===')
  console.log('Food name:', data.name)
  console.log('Calories:', data.calories)
  console.log('Protein:', data.protein_g, 'g')
  console.log('Fat:', data.fat_g, 'g')
  console.log('Sodium:', data.sodium_mg, 'mg')
  console.log('Carbs:', data.carbs_g, 'g')
}

testImage().catch(err => {
  console.error('Error:', err)
})
