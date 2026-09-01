import { createClient } from '@supabase/supabase-js';

// Supabase 데이터베이스 연결 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function HomePage() {
  // DB에서 서현동 삼겹살 데이터 1개 가져오기
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('region_dong', '서현동')
    .eq('category', '삼겹살')
    .single();

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #333', pb: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold' }}>동네 큐레이션 #1</span>
        <h1 style={{ fontSize: '24px', marginTop: '5px' }}>서현동 삼겹살 추천</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>포털 평점 종합 검증 완료 & 인근 추천 코스</p>
      </header>

      {shop ? (
        <section style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>{shop.shop_name}</h2>
            {shop.has_pet && <span style={{ backgroundColor: '#e6fcf5', color: '#0ca678', padding: '4px 8px', borderRadius: '20px', fontSize: '12px' }}>🐾 반려동물 동반</span>}
          </div>
          
          <p style={{ color: '#f59f00', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
            ★ {shop.score_summary}
          </p>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', margin: '15px 0', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>💡 큐레이터 선정 이유:</strong><br />
            {shop.reason_comment}
          </div>

          <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>
            📍 위치: {shop.address}
          </p>
        </section>
      ) : (
        <p>식당 정보를 불러오는 중입니다...</p>
      )}

      {/* 이웃 공공데이터 연계 구역 (다음 스텝에서 자동 연결 예정) */}
      <section style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '16px', color: '#333' }}>🐾 근처 들르기 좋은 장소 (공공데이터)</h3>
        <div style={{ padding: '15px', border: '1px dashed #ccc', borderRadius: '8px', color: '#888', fontSize: '13px' }}>
          • TourAPI 연동 예정: 율동공원 산책로 (차량 5분 거리)
        </div>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '16px', color: '#333' }}>💡 인근 착한가격업소</h3>
        <div style={{ padding: '15px', border: '1px dashed #ccc', borderRadius: '8px', color: '#888', fontSize: '13px' }}>
          • 착한가격 API 연동 예정: 가성비 식당 리스트 준비 중
        </div>
      </section>
    </main>
  );
}
