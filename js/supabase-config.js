// ============================================
// 🔌 Supabase Configuration
// ============================================
// ⚠️ 아래 값을 본인의 Supabase 프로젝트 정보로 교체하세요!

const SUPABASE_URL = 'https://dpditjxvhmfxkxbtgaak.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OP_07g5xFsHsH1LupngfHg_Xai43ZYo';

// Supabase CDN
const { createClient } = supabase;

// 전역 Supabase 클라이언트 생성 (index.html에서는 사용하지 않음)
let supabaseClient = null;

function initSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Toast 알림
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
