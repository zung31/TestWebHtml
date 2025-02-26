<?php
header('Content-Type: application/json');
require 'db.php';

$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

if ($category_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid category ID']);
    exit();
}
try {
    $stmt = $pdo->prepare("SELECT id, intitule, descriptif, created, modified FROM produits WHERE category_id = :category_id");
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($products) {
        echo json_encode(['success' => true, 'products' => $products]);
    } else {
        echo json_encode(['success' => true, 'products' => []]); 
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error fetching products: ' . $e->getMessage()]);
}
?>