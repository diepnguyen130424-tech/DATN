package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhGiaThongKeResponse {
    private Long sanPhamId;
    private double trungBinh;
    private long tongSo;
}
