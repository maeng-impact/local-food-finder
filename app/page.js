'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaces() {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPlaces(data);
        setFilteredPlaces(data);
      }
      setLoading(false);
    }
    fetchPlaces();
  }, []);

  // 카테고리 변경 필터링 함수
  const handleFilter = (category) => {
    setSelectedCategory(category);
    if (category === '전체') {
      setFilteredPlaces(places);
    } else {
      setFilteredPlaces(places.filter((p) => p.category === category));
    }
  };

  const categories = ['전체', '관광지', '음식점', '반려동물동반'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', margin: '40px 0 20px 0' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#111827', marginBottom: '8px' }}>
          📍 우리 동네 로컬 발견
        </h1>
        <p style={{ color: '#6B7280' }}>
          공공데이터로 찾는 알짜배기 관광지, 맛집, 반려동물 동반 장소
        </p>
      </header>

      {/* 카테고리 필터 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              backgroundColor: selectedCategory === cat ? '#4F46E5' : '#E5E7EB',
              color: selectedCategory === cat ? '#FFFFFF' : '#374151',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <main>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6B7280' }}>데이터를 불러오는 중입니다...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredPlaces.length === 0 ? (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#9CA3AF', padding: '40px 0' }}>
                해당 카테고리의 장소가 없습니다.
              </p>
            ) : (
              filteredPlaces.map((place) => (
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
                  <img 
                    src={place.image_url || 'https://images.unsplash.com/photo-1511497584788-8767611136f6?q=80&w=600&auto=format&fit=crop'} 
                    alt={place.title} 
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    onError={(e) => {
                      // 이미지 로딩 실패 시 깨진 이미지 대용 폴백 처리
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                  
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
        )}
      </main>
    </div>
  );
}