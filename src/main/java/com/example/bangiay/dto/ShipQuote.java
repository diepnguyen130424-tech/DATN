package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Kết quả tính phí vận chuyển theo khoảng cách cửa hàng → địa chỉ nhận hàng. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipQuote {
    /** true nếu định vị được địa chỉ và tính được khoảng cách */
    private boolean thanhCong;
    /** Khoảng cách (km), làm tròn 1 chữ số; null nếu không tính được */
    private Double khoangCachKm;
    /** Phí ship (VNĐ) */
    private int phiShip;
    /** OSRM = quãng đường thực tế | UOC_TINH = đường chim bay x hệ số | MAC_DINH = không định vị được */
    private String nguon;
    /** Địa chỉ mà bản đồ tìm thấy (để khách đối chiếu) */
    private String diaChiTimThay;
    private String thongBao;
}
