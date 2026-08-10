# Class Diagram - Hematrix Smart Monitoring

Berikut class diagram konseptual untuk sistem Hematrix berdasarkan arsitektur backend dan frontend yang ada:

```mermaid
classDiagram
    class CameraCapture {
        +captureFrame()
        +encodeFrame()
        +sendToAPI()
    }

    class YOLOModel {
        +loadModel()
        +detectPeople()
        +detectObjects()
    }

    class DetectionService {
        +processImage()
        +analyzeStatus()
        +generateNotification()
        +calculateRiskScore()
    }

    class DatabaseRepository {
        +connect()
        +ensureTables()
        +saveLog()
        +saveCorrection()
        +saveNotificationAction()
        +getLatestStatus()
    }

    class LogRecord {
        +id
        +timestamp
        +peopleCount
        +lampStatus
        +acStatus
        +dispenserStatus
        +condition
        +imagePath
        +powerData
        +notification
        +userId
    }

    class DeviceState {
        +deviceId
        +power
        +voltage
        +current
        +totalKwh
        +todayKwh
        +yesterdayKwh
        +factor
        +timeRecorded
    }

    class IoTDevice {
        +getControlMode()
        +updateStatus()
        +simulateReading()
    }

    class NotificationManager {
        +createAlert()
        +updateActionStatus()
        +sendNotification()
    }

    class UserManager {
        +login()
        +register()
        +validateRole()
    }

    class DashboardController {
        +getStatus()
        +getHistory()
        +getSummary()
        +getElectricityHistory()
        +setControl()
    }

    class FrontendPage {
        +renderDashboard()
        +renderHistory()
        +renderNotification()
        +renderSetting()
    }

    CameraCapture --> DetectionService : sends frame
    YOLOModel --> DetectionService : provides detection result
    DetectionService --> DatabaseRepository : stores results
    DetectionService --> NotificationManager : triggers alert
    DetectionService --> LogRecord : creates
    DatabaseRepository --> LogRecord : persists
    IoTDevice --> DatabaseRepository : writes device data
    IoTDevice --> DeviceState : produces
    DatabaseRepository --> DeviceState : persists
    UserManager --> DashboardController : authenticates
    DashboardController --> DatabaseRepository : reads/writes
    FrontendPage --> DashboardController : consumes API
```

Jika Anda mau, saya juga bisa bantu buat versi yang lebih formal untuk tugas sidang, misalnya:
- versi UML yang lebih rapi untuk laporan PDF
- versi yang menonjolkan backend saja
- versi yang menonjolkan hubungan frontend-backend-database
