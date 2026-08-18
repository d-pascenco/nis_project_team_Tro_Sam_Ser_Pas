from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SharedRoadmap(Base):
    __tablename__ = "shared_roadmaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    roadmap: Mapped[dict] = mapped_column(JSONB, nullable=False)
    form_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    profession: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    picture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    roadmap: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    form_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    completed_stages: Mapped[list[int]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserForm(Base):
    __tablename__ = "user_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # BasicInfoStep: fullName, age, location, currentStatus
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # EducationStep: education, university, specialization, yearsExperience, currentRole, cvSummary
    education: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cv_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # GoalsStep: targetProfession, targetIndustry, timeline, motivation, priorities
    target_profession: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_industry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    timeline: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    motivation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priorities: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    # SkillsStep: technicalSkills, softSkills, languages, learningStyle
    technical_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    soft_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    languages: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    learning_style: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ConstraintsStep: hoursPerWeek, budget, healthConsiderations, preferOnline,
    # preferRussian, needMentorship, additionalInfo
    hours_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    budget: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    health_considerations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prefer_online: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    prefer_russian: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    need_mentorship: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    schedule_items: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    target_hard_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    target_soft_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
