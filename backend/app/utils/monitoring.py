"""System health monitoring utilities."""
import logging
import psutil
import time
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class SystemMonitor:
    """Monitor system health and resource usage."""
    
    @staticmethod
    def get_system_health() -> Dict[str, Any]:
        """
        Get current system health metrics.
        
        Returns:
            Dict containing CPU, memory, and disk usage
        """
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_gb = memory.available / (1024 ** 3)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free_gb = disk.free / (1024 ** 3)
            
            return {
                "status": "healthy" if cpu_percent < 80 and memory_percent < 85 else "degraded",
                "timestamp": datetime.utcnow().isoformat(),
                "cpu": {
                    "usage_percent": round(cpu_percent, 2),
                    "count": psutil.cpu_count()
                },
                "memory": {
                    "usage_percent": round(memory_percent, 2),
                    "available_gb": round(memory_available_gb, 2),
                    "total_gb": round(memory.total / (1024 ** 3), 2)
                },
                "disk": {
                    "usage_percent": round(disk_percent, 2),
                    "free_gb": round(disk_free_gb, 2),
                    "total_gb": round(disk.total / (1024 ** 3), 2)
                }
            }
        except Exception as e:
            logger.error(f"Error getting system health: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    def check_critical_resources() -> Dict[str, bool]:
        """
        Check if critical resources are available.
        
        Returns:
            Dict with status of each critical resource
        """
        checks = {
            "cpu_ok": psutil.cpu_percent(interval=1) < 90,
            "memory_ok": psutil.virtual_memory().percent < 90,
            "disk_ok": psutil.disk_usage('/').percent < 90
        }
        
        checks["all_ok"] = all(checks.values())
        return checks


class PerformanceMonitor:
    """Monitor application performance metrics."""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.start_time = time.time()
    
    def record_request(self, response_time_ms: float, is_error: bool = False):
        """Record a request for metrics tracking."""
        self.request_count += 1
        if is_error:
            self.error_count += 1
        self.total_response_time += response_time_ms
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        uptime_seconds = time.time() - self.start_time
        avg_response_time = (
            self.total_response_time / self.request_count 
            if self.request_count > 0 
            else 0
        )
        error_rate = (
            (self.error_count / self.request_count * 100) 
            if self.request_count > 0 
            else 0
        )
        
        return {
            "uptime_seconds": round(uptime_seconds, 2),
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "error_rate_percent": round(error_rate, 2),
            "avg_response_time_ms": round(avg_response_time, 2)
        }
    
    def reset(self):
        """Reset all counters."""
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.start_time = time.time()


# Global monitor instance
performance_monitor = PerformanceMonitor()
