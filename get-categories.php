<?php
header('Content-Type: application/json');
require 'db.php';

try {
    $query = "SELECT * FROM categories ORDER BY `order` ASC";
    $stmt = $pdo->query($query);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'categories' => $categories]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des catégories: ' . $e->getMessage()]);
}
?>