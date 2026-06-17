package com.jeeva.petcare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id:${razorpay.key.id:rzp_test_SBhh5VRQMzU46B}}")
    private String keyId;

    @Value("${razorpay.key-secret:${razorpay.key.secret:BKuYZZXEIT2QOm9nE2RweqjR}}")
    private String keySecret;

    public RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }

    public String getKeyId() {
        return keyId;
    }
}