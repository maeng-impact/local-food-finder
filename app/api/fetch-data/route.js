import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 키 전처리 함수 (인코딩/디코딩 문제 방지)
function getApiKey(keyName) {
  const rawKey = process.env[keyName] || process.env[`NEXT_PUBLIC_${keyName}`] || '';
  if (!rawKey) return '';
  return decodeURIComponent(rawKey);
}

export async function GET() {
  const results = {
    tourApi: 0,
    petTour: 0,
    goodPrice: 0,
    market: 0,
    errors: []
  };

  try {
    // 1. 한국관광공사 국문 관광정보 (경기도 광주시 지역코드 31, 시군구 5)
    const tourKey = getApiKey('TOUR_API_KEY');
    if (tourKey) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${encodeURIComponent(tourKey)}&numOfRows=30&pageNo=1&MobileOS=ETC&MobileApp=LocalApp&_type=json&areaCode=31`;
        const res = await fetch(url);
        const data = await res.json();
        const items = data.response?.body?.items?.item || [];

        const placesToInsert = items.map(item => ({
          title: item.title || '알 수 없는 장소',
          category: item.contenttypeid === '39' ? '음식점' : '관광지',
          address: item.addr1 ? item.addr1 + (item.addr2 ? ' ' + item.addr2 : '') : '주소 정보 없음',
          tel: item.tel || '',
          image_url: item.firstimage || item.firstimage2 || '',
          latitude: item.mapy ? parseFloat(item.mapy) : null,
          longitude: item.mapx ? parseFloat(item.mapx) : null,
          source_type: 'tour_api'
        })).filter(p => p.title && p.address);

        if (placesToInsert.length > 0) {
          const { data: inserted, error } = await supabase
            .from('places')
            .upsert(placesToInsert, { onConflict: 'title,address' });

          if (error) {
            results.errors.push(`TourAPI DB Error: ${error.message}`);
          } else {
            results.tourApi = placesToInsert.length;
          }
        } else {
          results.errors.push('TourAPI: 가져온 항목이 없습니다.');
        }
      } catch (err) {
        results.errors.push(`TourAPI Fetch Error: ${err.message}`);
      }
    } else {
      results.errors.push('TOUR_API_KEY 가 설정되지 않았습니다.');
    }

    // 2. 반려동물 동반 여행 정보
    const petKey = getApiKey('PET_TOUR_API_KEY');
    if (petKey) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorPetTourService/detailPetTour1?serviceKey=${encodeURIComponent(petKey)}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=LocalApp&_type=json`;
        const res = await fetch(url);
        const data = await res.json();
        const items = data.response?.body?.items?.item || [];

        const petPlaces = items.map(item => ({
          title: item.title || '반려동물 동반 장소',
          category: '반려동물동반',
          address: item.addr1 || '주소 정보 없음',
          tel: item.tel || '',
          image_url: item.firstimage || '',
          source_type: 'pet_tour'
        })).filter(p => p.title && p.address !== '주소 정보 없음');

        if (petPlaces.length > 0) {
          const { error } = await supabase
            .from('places')
            .upsert(petPlaces, { onConflict: 'title,address' });

          if (error) {
            results.errors.push(`PetTour DB Error: ${error.message}`);
          } else {
            results.petTour = petPlaces.length;
          }
        }
      } catch (err) {
        results.errors.push(`PetTour Fetch Error: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: '공공데이터 수집 완료',
      summary: results
    });

  } catch (globalError) {
    return NextResponse.json({
      success: false,
      error: globalError.message
    }, { status: 500 });
  }
}