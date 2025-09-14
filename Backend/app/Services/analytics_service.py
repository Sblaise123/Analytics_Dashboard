import random
from datetime import datetime, timedelta
from typing import List

from app.schemas.analytics import MetricData, ChartData, ChartDataPoint, DashboardResponse


class AnalyticsService:
    
    @staticmethod
    def generate_metrics(user_role: str) -> List[MetricData]:
        """Generate metrics based on user role"""
        base_metrics = [
            MetricData(
                name="Total Revenue",
                value=125000.0,
                change=12.5,
                change_type="increase"
            ),
            MetricData(
                name="Active Users", 
                value=8439.0,
                change=-2.1,
                change_type="decrease"
            ),
            MetricData(
                name="Conversion Rate",
                value=3.42,
                change=0.8,
                change_type="increase"
            )
        ]
        
        # Add advanced metrics for analysts and above
        if user_role in ["analyst", "manager", "admin"]:
            advanced_metrics = [
                MetricData(
                    name="Customer Lifetime Value",
                    value=245.67,
                    change=8.3,
                    change_type="increase"
                ),
                MetricData(
                    name="Churn Rate",
                    value=5.2,
                    change=-1.1,
                    change_type="decrease"
                )
            ]
            base_metrics.extend(advanced_metrics)
        
        return base_metrics
    
    @staticmethod
    def generate_revenue_chart() -> ChartData:
        """Generate revenue trend chart data"""
        data_points = []
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            value = 4000 + random.randint(-500, 1000)
            data_points.append(ChartDataPoint(date=date, value=float(value)))
        
        return ChartData(
            title="Daily Revenue",
            type="line",
            data=data_points
        )
    
    @staticmethod
    def generate_category_chart() -> ChartData:
        """Generate sales by category chart"""
        categories = ["Electronics", "Clothing", "Books", "Home & Garden", "Sports"]
        data_points = []
        
        for category in categories:
            value = random.randint(1000, 5000)
            data_points.append(ChartDataPoint(
                date=datetime.now().strftime("%Y-%m-%d"),
                value=float(value),
                category=category
            ))
        
        return ChartData(
            title="Sales by Category",
            type="bar", 
            data=data_points
        )
    
    @staticmethod
    def generate_demographics_chart() -> ChartData:
        """Generate user demographics chart"""
        demographics = ["18-24", "25-34", "35-44", "45-54", "55+"]
        data_points = []
        
        for demo in demographics:
            value = random.randint(500, 2000)
            data_points.append(ChartDataPoint(
                date=datetime.now().strftime("%Y-%m-%d"),
                value=float(value),
                category=demo
            ))
        
        return ChartData(
            title="User Demographics",
            type="pie",
            data=data_points
        )
    
    def get_dashboard_data(self, user_role: str) -> DashboardResponse:
        """Get complete dashboard data for user role"""
        metrics = self.generate_metrics(user_role)
        charts = [
            self.generate_revenue_chart(),
            self.generate_category_chart(),
            self.generate_demographics_chart()
        ]
        
        return DashboardResponse(metrics=metrics, charts=charts)


analytics_service = AnalyticsService()