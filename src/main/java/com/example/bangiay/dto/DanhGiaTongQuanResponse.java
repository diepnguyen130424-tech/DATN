package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhGiaTongQuanResponse {
    private double trungBinh;
    private int tongSo;
    /** key = số sao (1..5), value = số lượt */
    private Map<Integer, Integer> phanBo;
    private List<DanhGiaResponse> danhGias;
}
