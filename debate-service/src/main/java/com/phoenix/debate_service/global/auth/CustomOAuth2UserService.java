package com.phoenix.debate_service.global.auth;

import com.phoenix.debate_service.user.domain.Provider;
import com.phoenix.debate_service.user.domain.User;
import com.phoenix.debate_service.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

// @Service  // 로그인 기능 비활성화 (도메인 없음)
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        OAuth2UserInfo userInfo = getOAuth2UserInfo(registrationId, attributes);
        User user = getOrCreateUser(userInfo);

        return new CustomOAuth2User(user, attributes);
    }

    private OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "kakao" -> new KakaoOAuth2UserInfo(attributes);
            case "naver" -> new NaverOAuth2UserInfo(attributes);
            default -> throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인: " + registrationId);
        };
    }

    private User getOrCreateUser(OAuth2UserInfo userInfo) {
        return userRepository.findBySocialIdAndProvider(userInfo.getSocialId(), userInfo.getProvider())
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .socialId(userInfo.getSocialId())
                                .provider(userInfo.getProvider())
                                .email(userInfo.getEmail())
                                .nickname(userInfo.getNickname())
                                .profileImage(userInfo.getProfileImage())
                                .build()
                ));
    }
}
