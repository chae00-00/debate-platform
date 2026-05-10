package com.phoenix.debate_service.global.auth;

import com.phoenix.debate_service.user.domain.Provider;

public interface OAuth2UserInfo {
    Provider getProvider();
    String getSocialId();
    String getEmail();
    String getNickname();
    String getProfileImage();
}
