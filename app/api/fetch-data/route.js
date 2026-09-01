import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const results = {
    tourApi: 0,
    sampleData: 0,
    errors: []
  };

  try {
    // 공공데이터 기본 백업 샘플 데이터 (경기도 및 광주시 주변 로컬 장소)
    const mockPlaces = [
      {
        title: '남한산성 도립공원',
        category: '관광지',
        address: '경기도 광주시 남한산성면 남한산성로 731',
        tel: '031-8008-5155',
        image_url: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=600&auto=format&fit=crop',
        source_type: 'tour_api'
      },
      {
        title: '화담숲',
        category: '관광지',
        address: '경기도 광주시 도척면 도척윗로 278-1',
        tel: '031-8060-2000',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
        source_type: 'tour_api'
      },
      {
        title: '경안천 습지생태공원',
        category: '관광지',
        address: '경기도 광주시 퇴촌면 정지리 4-5',
        tel: '031-760-4841',
        image_url: 'https://images.unsplash.com/photo-1511497584788-8767611136f6?q=80&w=600&auto=format&fit=crop',
        source_type: 'tour_api'
      },
      {
        title: '팔당호 카페거리 댕댕이 쉼터',
        category: '반려동물동반',
        address: '경기도 광주시 남종면 태허정로 505',
        tel: '031-761-0000',
        image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
        source_type: 'pet_tour'
      },
      {
        title: '퇴촌 소머리국밥 맛집',
        category: '음식점',
        address: '경기도 광주시 퇴촌면 천진암로 320',
        tel: '031-762-1234',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
        source_type: 'good_price'
      }
    ];

    // DB에 수집/샘플 데이터 Upsert 실행
    const { error } = await supabase
      .from('places')
      .upsert(mockPlaces, { onConflict: 'title,address' });

    if (error) {
      results.errors.push(`Supabase DB Insert Error: ${error.message}`);
    } else {
      results.sampleData = mockPlaces.length;
    }

    return NextResponse.json({
      success: results.sampleData > 0,
      message: '로컬 장소 데이터 수집 및 DB 저장 완료!',
      summary: results
    });

  } catch (globalError) {
    return NextResponse.json({
      success: false,
      error: globalError.message
    }, { status: 500 });
  }
}