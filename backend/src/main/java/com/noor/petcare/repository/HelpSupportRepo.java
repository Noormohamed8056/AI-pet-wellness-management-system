package com.jeeva.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jeeva.petcare.model.HelpSupport;

public interface HelpSupportRepo extends JpaRepository<HelpSupport, Long> {

    List<HelpSupport> findByUserId(Long userId);

    List<HelpSupport> findByRaisedBy(HelpSupport.RaisedBy raisedBy);

    List<HelpSupport> findByStatus(HelpSupport.Status status);
}
