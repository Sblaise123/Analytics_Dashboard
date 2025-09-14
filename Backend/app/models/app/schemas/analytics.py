from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MetricData(BaseModel):
    name: str = Field(..., description="Metric name")
    value: float = Field(..., description="Metric value")
    change: float = Field(..., description="Percentage change")
    change_type: str = Field(..., regex="^(increase|decrease)$")


class ChartDataPoint(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    value: float = Field(..., description="Data point value")
    category: Optional[str] = Field(None, description="Data category")


class ChartData(BaseModel):
    title: str = Field(..., description="Chart title")
    type: str = Field(..., regex="^(line|bar|pie)$")
    data: List[ChartDataPoint] = Field(..., description="Chart data points")


class DashboardResponse(BaseModel):
    metrics: List[MetricData] = Field(..., description="Dashboard metrics")
    charts: List[ChartData] = Field(..., description="Dashboard charts")


class ReportRequest(BaseModel):
    report_type: str = Field(..., description="Type of report to generate")
    date_range: dict = Field(..., description="Date range for report")
    format: str = Field(default="json", regex="^(json|csv|excel)$")
