package com.noor.petcare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id:${razorpay.key.id:rzp_test_SBhh5VRQMzU46B}}")
    private String keyId;

    @Value("${razorpay.key-secret:${razorpay.key.secret:}}")
    private String keySecret;

    public RazorpayClient getRazorpayClient() throws RazorpayException {
        // Temporary diagnostic logs to help trace authentication failures
        System.out.println("RAZORPAY KEY: " + keyId);
        System.out.println("RAZORPAY SECRET PRESENT: " + (keySecret != null && !keySecret.isBlank()));
        return new RazorpayClient(keyId, keySecret);
    }

    public String getKeyId() {
        return keyId;
    }
    public String getKeySecret() {
        return keySecret;
    }
}