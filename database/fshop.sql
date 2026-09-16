
CREATE TABLE tai_khoan (
  id BIGSERIAL PRIMARY KEY,
  ten_dang_nhap VARCHAR(100) NOT NULL UNIQUE,
  mat_khau VARCHAR(255) NOT NULL,
  vai_tro VARCHAR(30) NOT NULL CHECK (vai_tro IN ('QUAN_TRI','NHAN_VIEN','KHACH_HANG')),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG'
    CHECK (trang_thai IN ('HOAT_DONG','NGUNG_HOAT_DONG','BI_KHOA')),
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khach_hang (
  id BIGSERIAL PRIMARY KEY,
  tai_khoan_id BIGINT NOT NULL UNIQUE,
  ho_ten VARCHAR(150) NOT NULL,
  so_dien_thoai VARCHAR(20),
  ngay_sinh DATE,
  gioi_tinh VARCHAR(20),
  FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT
);

CREATE TABLE nhan_vien (
  id BIGSERIAL PRIMARY KEY,
  tai_khoan_id BIGINT NOT NULL UNIQUE,
  ho_ten VARCHAR(150) NOT NULL,
  so_dien_thoai VARCHAR(20),
  chuc_vu VARCHAR(50) NOT NULL,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  ngay_vao_lam DATE,
  FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id) ON DELETE RESTRICT
);

CREATE TABLE dia_chi (
  id BIGSERIAL PRIMARY KEY,
  khach_hang_id BIGINT NOT NULL,
  ten_nguoi_nhan VARCHAR(150) NOT NULL,
  so_dien_thoai VARCHAR(20) NOT NULL,
  dia_chi TEXT NOT NULL,
  mac_dinh BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE CASCADE
);

CREATE TABLE danh_muc (
  id BIGSERIAL PRIMARY KEY,
  ten_danh_muc VARCHAR(150) NOT NULL UNIQUE,
  mo_ta TEXT,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE thuong_hieu (
  id BIGSERIAL PRIMARY KEY,
  ten_thuong_hieu VARCHAR(150) NOT NULL UNIQUE,
  mo_ta TEXT,
  quoc_gia_thuong_hieu VARCHAR(100),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kich_co (
  id BIGSERIAL PRIMARY KEY,
  ten_kich_co VARCHAR(20) NOT NULL UNIQUE,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG'
);

CREATE TABLE mau_sac (
  id BIGSERIAL PRIMARY KEY,
  ten_mau VARCHAR(50) NOT NULL UNIQUE,
  ma_mau VARCHAR(20),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG'
);

CREATE TABLE san_pham (
  id BIGSERIAL PRIMARY KEY,
  danh_muc_id BIGINT NOT NULL,
  thuong_hieu_id BIGINT NOT NULL,
  ma_san_pham VARCHAR(100) NOT NULL UNIQUE,
  ten_san_pham VARCHAR(255) NOT NULL,
  chat_lieu VARCHAR(100),
  kieu_dang VARCHAR(100),
  xuat_xu VARCHAR(100),
  mo_ta TEXT,
  hinh_anh VARCHAR(500),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id) ON DELETE RESTRICT,
  FOREIGN KEY (thuong_hieu_id) REFERENCES thuong_hieu(id) ON DELETE RESTRICT
);

CREATE TABLE san_pham_chi_tiet (
  id BIGSERIAL PRIMARY KEY,
  san_pham_id BIGINT NOT NULL,
  kich_co_id BIGINT NOT NULL,
  mau_sac_id BIGINT NOT NULL,
  ma_sku VARCHAR(100) NOT NULL UNIQUE,
  gia_ban NUMERIC(15,2) NOT NULL CHECK (gia_ban >= 0),
  so_luong_ton INTEGER NOT NULL DEFAULT 0 CHECK (so_luong_ton >= 0),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (san_pham_id, kich_co_id, mau_sac_id),
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(id) ON DELETE RESTRICT,
  FOREIGN KEY (kich_co_id) REFERENCES kich_co(id) ON DELETE RESTRICT,
  FOREIGN KEY (mau_sac_id) REFERENCES mau_sac(id) ON DELETE RESTRICT
);

CREATE TABLE gio_hang (
  id BIGSERIAL PRIMARY KEY,
  khach_hang_id BIGINT NOT NULL UNIQUE,
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE CASCADE
);

CREATE TABLE chi_tiet_gio_hang (
  id BIGSERIAL PRIMARY KEY,
  gio_hang_id BIGINT NOT NULL,
  san_pham_chi_tiet_id BIGINT NOT NULL,
  so_luong INTEGER NOT NULL CHECK (so_luong > 0),
  UNIQUE (gio_hang_id, san_pham_chi_tiet_id),
  FOREIGN KEY (gio_hang_id) REFERENCES gio_hang(id) ON DELETE CASCADE,
  FOREIGN KEY (san_pham_chi_tiet_id) REFERENCES san_pham_chi_tiet(id) ON DELETE RESTRICT
);

CREATE TABLE ma_giam_gia (
  id BIGSERIAL PRIMARY KEY,
  ma_voucher VARCHAR(100) NOT NULL UNIQUE,
  ten_voucher VARCHAR(255) NOT NULL,
  loai_giam VARCHAR(30) NOT NULL CHECK (loai_giam IN ('PHAN_TRAM','SO_TIEN')),
  gia_tri_giam NUMERIC(15,2) NOT NULL CHECK (gia_tri_giam >= 0),
  giam_toi_da NUMERIC(15,2) CHECK (giam_toi_da IS NULL OR giam_toi_da >= 0),
  don_toi_thieu NUMERIC(15,2) CHECK (don_toi_thieu IS NULL OR don_toi_thieu >= 0),
  so_luong INTEGER NOT NULL DEFAULT 0 CHECK (so_luong >= 0),
  so_luong_da_dung INTEGER NOT NULL DEFAULT 0 CHECK (so_luong_da_dung >= 0),
  ngay_bat_dau TIMESTAMP NOT NULL,
  ngay_ket_thuc TIMESTAMP NOT NULL,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  CHECK (ngay_ket_thuc > ngay_bat_dau),
  CHECK (so_luong_da_dung <= so_luong)
);

CREATE TABLE hoa_don (
  id BIGSERIAL PRIMARY KEY,
  ma_hoa_don VARCHAR(100) NOT NULL UNIQUE,
  khach_hang_id BIGINT,
  nhan_vien_id BIGINT,
  dia_chi_id BIGINT,
  voucher_id BIGINT,
  loai_hoa_don VARCHAR(30) NOT NULL CHECK (loai_hoa_don IN ('ONLINE','TAI_QUAY')),
  ngay_lap TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tong_tien_hang NUMERIC(15,2) NOT NULL CHECK (tong_tien_hang >= 0),
  tien_giam NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (tien_giam >= 0),
  phi_van_chuyen NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (phi_van_chuyen >= 0),
  tong_thanh_toan NUMERIC(15,2) NOT NULL CHECK (tong_thanh_toan >= 0),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_XAC_NHAN',
  ghi_chu TEXT,
  ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE SET NULL,
  FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE SET NULL,
  FOREIGN KEY (dia_chi_id) REFERENCES dia_chi(id) ON DELETE SET NULL,
  FOREIGN KEY (voucher_id) REFERENCES ma_giam_gia(id) ON DELETE SET NULL
);

CREATE TABLE chi_tiet_hoa_don (
  id BIGSERIAL PRIMARY KEY,
  hoa_don_id BIGINT NOT NULL,
  san_pham_chi_tiet_id BIGINT NOT NULL,
  so_luong INTEGER NOT NULL CHECK (so_luong > 0),
  don_gia NUMERIC(15,2) NOT NULL CHECK (don_gia >= 0),
  thanh_tien NUMERIC(15,2) NOT NULL CHECK (thanh_tien >= 0),
  UNIQUE (hoa_don_id, san_pham_chi_tiet_id),
  FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id) ON DELETE CASCADE,
  FOREIGN KEY (san_pham_chi_tiet_id) REFERENCES san_pham_chi_tiet(id) ON DELETE RESTRICT
);

CREATE TABLE thanh_toan (
  id BIGSERIAL PRIMARY KEY,
  hoa_don_id BIGINT NOT NULL UNIQUE,
  phuong_thuc VARCHAR(30) NOT NULL CHECK (phuong_thuc IN ('TIEN_MAT','CHUYEN_KHOAN')),
  so_tien NUMERIC(15,2) NOT NULL CHECK (so_tien >= 0),
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'CHO_THANH_TOAN'
    CHECK (trang_thai IN ('CHO_THANH_TOAN','DA_THANH_TOAN','THAT_BAI','HOAN_TIEN')),
  ma_giao_dich VARCHAR(255),
  ngay_thanh_toan TIMESTAMP,
  FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id) ON DELETE CASCADE
);

CREATE TABLE lich_su_hoa_don (
  id BIGSERIAL PRIMARY KEY,
  hoa_don_id BIGINT NOT NULL,
  nhan_vien_id BIGINT,
  trang_thai VARCHAR(30) NOT NULL,
  thoi_gian TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ghi_chu TEXT,
  FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id) ON DELETE CASCADE,
  FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE SET NULL
);

CREATE TABLE chuong_trinh_giam_gia (
  id BIGSERIAL PRIMARY KEY,
  ten_chuong_trinh VARCHAR(255) NOT NULL,
  loai_giam VARCHAR(30) NOT NULL CHECK (loai_giam IN ('PHAN_TRAM','SO_TIEN')),
  gia_tri_giam NUMERIC(15,2) NOT NULL CHECK (gia_tri_giam >= 0),
  ngay_bat_dau TIMESTAMP NOT NULL,
  ngay_ket_thuc TIMESTAMP NOT NULL,
  trang_thai VARCHAR(30) NOT NULL DEFAULT 'HOAT_DONG',
  CHECK (ngay_ket_thuc > ngay_bat_dau)
);

CREATE TABLE san_pham_giam_gia (
  id BIGSERIAL PRIMARY KEY,
  san_pham_id BIGINT NOT NULL,
  chuong_trinh_giam_gia_id BIGINT NOT NULL,
  UNIQUE (san_pham_id, chuong_trinh_giam_gia_id),
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(id) ON DELETE CASCADE,
  FOREIGN KEY (chuong_trinh_giam_gia_id) REFERENCES chuong_trinh_giam_gia(id) ON DELETE CASCADE
);

-- Index cho cac khoa ngoai thuong dung
CREATE INDEX idx_dia_chi_khach_hang ON dia_chi(khach_hang_id);
CREATE INDEX idx_sp_danh_muc ON san_pham(danh_muc_id);
CREATE INDEX idx_sp_thuong_hieu ON san_pham(thuong_hieu_id);
CREATE INDEX idx_spct_san_pham ON san_pham_chi_tiet(san_pham_id);
CREATE INDEX idx_hoa_don_khach_hang ON hoa_don(khach_hang_id);
CREATE INDEX idx_hoa_don_nhan_vien ON hoa_don(nhan_vien_id);
CREATE INDEX idx_hoa_don_trang_thai ON hoa_don(trang_thai);
CREATE INDEX idx_cthd_hoa_don ON chi_tiet_hoa_don(hoa_don_id);
CREATE INDEX idx_lshd_hoa_don ON lich_su_hoa_don(hoa_don_id);
CREATE INDEX idx_spgg_san_pham ON san_pham_giam_gia(san_pham_id);
CREATE INDEX idx_spgg_chuong_trinh ON san_pham_giam_gia(chuong_trinh_giam_gia_id);
