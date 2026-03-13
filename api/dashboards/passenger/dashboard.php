<?php
session_start();

// Protect page
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'passenger') {
    header("Location: ../index.php");
    exit;
}

$name = $_SESSION['name'];
?>

<!DOCTYPE html>
<html>
<head>
    <title>Passenger Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            margin: 0;
        }

        header {
            background: #1e88e5;
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
        }

        nav {
            background: #fff;
            padding: 15px;
            width: 200px;
            height: 100vh;
            position: fixed;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }

        nav a {
            display: block;
            padding: 10px;
            text-decoration: none;
            color: #333;
            margin-bottom: 5px;
        }

        nav a:hover {
            background: #1e88e5;
            color: white;
        }

        main {
            margin-left: 220px;
            padding: 20px;
        }

        .card {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin-bottom: 15px;
        }
    </style>
</head>

<body>

<header>
    <h2>🚌 Bus System</h2>
    <div>
        Welcome, <?php echo htmlspecialchars($name); ?> |
        <a href="../logout.php" style="color:white;">Logout</a>
    </div>
</header>

<nav>
    <a href="dashboard.php">Dashboard</a>
    <a href="book_bus.php">Book Bus</a>
    <a href="my_bookings.php">My Bookings</a>
    <a href="profile.php">Profile</a>
</nav>

<main>

    <div class="card">
        <h3>Passenger Dashboard</h3>
        <p>Welcome to your account.</p>
    </div>

    <div class="card">
        <h3>Quick Actions</h3>
        <ul>
            <li>📌 Book a Bus</li>
            <li>📌 View Your Bookings</li>
            <li>📌 Update Profile</li>
        </ul>
    </div>

</main>

</body>
</html>
