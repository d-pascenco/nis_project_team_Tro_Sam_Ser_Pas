from datetime import datetime
from typing import Any, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class LanguageLevel(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    level: int = Field(ge=0, le=100)


class UserFormCreate(BaseModel):
    """Payload from src/pages/Onboarding.tsx FormData.

    The frontend currently keeps values in camelCase. The backend stores them in
    snake_case columns, but accepts both names so curl/SQL-oriented checks remain
    convenient.
    """

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    # BasicInfoStep
    full_name: Optional[str] = Field(default=None, max_length=255, validation_alias=AliasChoices("fullName", "full_name"))
    age: Optional[int] = Field(default=None, ge=0, le=120)
    location: Optional[str] = Field(default=None, max_length=255)
    country: Optional[str] = Field(default=None, max_length=100)
    current_status: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("currentStatus", "current_status"))
    email: Optional[str] = Field(default=None, max_length=255)

    # EducationStep
    education: Optional[str] = Field(default=None, max_length=255)
    university: Optional[str] = Field(default=None, max_length=255)
    specialization: Optional[str] = Field(default=None, max_length=255)
    years_experience: Optional[int] = Field(default=None, ge=0, le=80, validation_alias=AliasChoices("yearsExperience", "years_experience"))
    current_role: Optional[str] = Field(default=None, max_length=255, validation_alias=AliasChoices("currentRole", "current_role"))
    cv_summary: Optional[str] = Field(default=None, validation_alias=AliasChoices("cvSummary", "cv_summary"))

    # GoalsStep
    target_profession: Optional[str] = Field(default=None, max_length=255, validation_alias=AliasChoices("targetProfession", "target_profession"))
    target_industry: Optional[str] = Field(default=None, max_length=255, validation_alias=AliasChoices("targetIndustry", "target_industry"))
    timeline: Optional[str] = Field(default=None, max_length=100)
    motivation: Optional[str] = None
    priorities: list[str] = Field(default_factory=list)

    # SkillsStep
    technical_skills: list[str] = Field(default_factory=list, validation_alias=AliasChoices("technicalSkills", "technical_skills"))
    soft_skills: list[str] = Field(default_factory=list, validation_alias=AliasChoices("softSkills", "soft_skills"))
    languages: list[LanguageLevel] = Field(default_factory=list)
    learning_style: Optional[str] = Field(default=None, max_length=255, validation_alias=AliasChoices("learningStyle", "learning_style"))

    # ConstraintsStep
    hours_per_week: Optional[int] = Field(default=None, ge=0, le=80, validation_alias=AliasChoices("hoursPerWeek", "hours_per_week"))
    budget: Optional[str] = Field(default=None, max_length=255)
    health_considerations: Optional[str] = Field(default=None, validation_alias=AliasChoices("healthConsiderations", "health_considerations"))
    prefer_online: Optional[bool] = Field(default=None, validation_alias=AliasChoices("preferOnline", "prefer_online"))
    prefer_russian: Optional[bool] = Field(default=None, validation_alias=AliasChoices("preferRussian", "prefer_russian"))
    need_mentorship: Optional[bool] = Field(default=None, validation_alias=AliasChoices("needMentorship", "need_mentorship"))
    additional_info: Optional[str] = Field(default=None, validation_alias=AliasChoices("additionalInfo", "additional_info"))
    schedule_items: list[dict] = Field(default_factory=list, validation_alias=AliasChoices("scheduleItems", "schedule_items"))
    target_hard_skills: list[str] = Field(default_factory=list, validation_alias=AliasChoices("targetHardSkills", "target_hard_skills"))
    target_soft_skills: list[str] = Field(default_factory=list, validation_alias=AliasChoices("targetSoftSkills", "target_soft_skills"))

    @field_validator("age", "years_experience", "hours_per_week", mode="before")
    @classmethod
    def coerce_empty_string_to_none(cls, value: Any) -> Any:
        if value == "" or value is None:
            return None
        return value

    @field_validator("priorities", "technical_skills", "soft_skills", "target_hard_skills", "target_soft_skills", mode="before")
    @classmethod
    def empty_list_for_none(cls, value: Any) -> Any:
        return [] if value is None else value

    @field_validator("languages", mode="before")
    @classmethod
    def empty_languages_for_none(cls, value: Any) -> Any:
        return [] if value is None else value

    def to_model_dict(self) -> dict[str, Any]:
        values = self.model_dump()
        values["languages"] = [language.model_dump() for language in self.languages]
        return values


class UserFormResponse(BaseModel):
    id: int
    message: str
    created_at: Optional[datetime] = None
