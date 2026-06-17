//LoginResponse.java
package com.jeeva.petcare.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private Long userId;
    private String role;
    private boolean needsProfile;
    private boolean pendingApproval;
    private String message;
}
