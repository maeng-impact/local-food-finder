import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const results = {
    tourApi: 0,
    petTour: 0,
    goodPrice: 0,
    market: 0,
    errors: []
  };

  try {
    // 1. 한국관광공사 국문 관광정보 (경기도 기준 샘플 수집)
    const tourApiKey = process.env.TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY;
    if (tourApiKey) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${encodeURIComponent(tourApiKey)}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&areaCode=31`;
        const res = await fetch(url);
        const data = await res.json();
        const items = data.response?.body?.items?.item || [];

        const placesToInsert = items.map(item => ({
          title: item.title,
          category: item.contenttypeid === '39' ? '음식점' : '관광지',
          address: item.addr1 + (item.addr2 ? ' ' + item.addr2 : ''),
          tel: item.tel || '',
          image_url: item.firstimage || '',
          latitude: item.mapy ? parseFloat(item.mapy) : null,
          longitude: item.mapx ? parseFloat(item.mapx) : null,
          source_type: 'tour_api'
        }));

        if (placesToInsert.length > 0) {
          const { error } = await supabase
            .from('places')
            .upsert(placesToInsert, { onConflict: 'title,address' });
          if (!error) results.tourApi = placesToInsert.length;
          else results.errors.push(`TourAPI DB Insert Error: ${error.message}`);
        }
      } catch (err) {
        results.errors.push(`TourAPI Fetch Error: ${err.message}`);
      }
    }

    // 2. 반려동물 동반 여행 정보
    const petApiKey = process.env.PET_TOUR_API_KEY || process.env.NEXT_PUBLIC_PET_TOUR_API_KEY;
    if (petApiKey) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorPetTourService/detailPetTour1?serviceKey=${encodeURIComponent(petApiKey)}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json`;
        const res = await fetch(url);
        const data = await res.json();
        const items = data.response?.body?.items?.item || [];

        const petPlaces = items.map(item => ({
          title: item.title || '반려동물 동반 장소',
          category: '반려동물동반',
          address: item.addr1 || '',
          tel: item.tel || '',
          image_url: item.firstimage || '',
          source_type: 'pet_tour'
        }));

        if (petPlaces.length > 0) {
          const { error } = await supabase
            .from('places')
            .upsert(petPlaces, { onConflict: 'title,address' });
          if (!error) results.petTour = petPlaces.length;
          else results.errors.push(`PetTour DB Insert Error: ${error.message}`);
        }
      } catch (err) {
        results.errors.push(`PetTour Fetch Error: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: '공공데이터 수집 작업 완료',
      summary: results
    });

  } catch (globalError) {
    return NextResponse.json({
      success: false,
      error: globalError.message
    }, { status: 500 });
  }
}
