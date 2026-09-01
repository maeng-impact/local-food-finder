export const metadata = {
  title: '동네 맛집 & 관광 큐레이션',
  description: '지역별 식당, 관광지, 전통시장 정보',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
