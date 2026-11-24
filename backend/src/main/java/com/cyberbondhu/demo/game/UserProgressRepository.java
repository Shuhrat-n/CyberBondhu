package com.cyberbondhu.demo.game;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    @Query("select count(distinct p.scenarioId) from UserProgress p where p.userId = :userId")
    long countDistinctScenarioByUserId(Long userId);
    
    long countByUserId(Long userId);
    long countByUserIdAndCorrectTrue(Long userId);
}