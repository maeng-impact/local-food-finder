import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 60초마다 화면 데이터를 자동으로 최신화
export const revalidate = 60;

async function getPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Data fetch error:', error);
    return [];
  }
  return data || [];
}

export default async function HomePage() {
  const places = await getPlaces();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', margin: '40px 0' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#111827', marginBottom: '8px' }}>
          📍 우리 동네 로컬 발견
        </h1>
        <p style={{ color: '#6B7280' }}>
          공공데이터로 찾는 알짜배기 관광지, 맛집, 반려동물 동반 장소
        </p>
      </header>

      <main>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {places.length === 0 ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#9CA3AF' }}>
              아직 등록된 장소가 없습니다.
            </p>
          ) : (
            places.map((place) => (
              <div 
                key={place.id} 
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {place.image_url ? (
                  <img 
                    src={place.image_url} 
                    alt={place.title} 
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9CA3AF'
                  }}>
                    이미지 없음
                  </div>
                )}
                
                <div style={{ padding: '16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    backgroundColor: place.source_type === 'pet_tour' ? '#FEF3C7' : '#E0E7FF',
                    color: place.source_type === 'pet_tour' ? '#D97706' : '#4338CA',
                    marginBottom: '8px'
                  }}>
                    {place.category || '장소'}
                  </span>

                  <h3 style={{ fontSize: '1.1rem', margin: '4px 0 8px 0', color: '#1F2937' }}>
                    {place.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: '4px 0' }}>
                    📌 {place.address || '주소 정보 없음'}
                  </p>

                  {place.tel && (
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '4px 0' }}>
                      📞 {place.tel}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}