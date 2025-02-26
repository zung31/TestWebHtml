<?php
header('Content-Type: application/json');

require 'db.php';

$searchTerm = $_GET['q'];

try {
    // Tìm kiếm danh mục
    $query = "SELECT * FROM categories WHERE intitule LIKE :searchTerm";
    $stmt = $pdo->prepare($query);
    $stmt->execute([':searchTerm' => '%' . $searchTerm . '%']);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Tìm kiếm sản phẩm
    $query = "SELECT * FROM produits WHERE intitule LIKE :searchTerm";
    $stmt = $pdo->prepare($query);
    $stmt->execute([':searchTerm' => '%' . $searchTerm . '%']);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'categories' => $categories, 'products' => $products]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la recherche: ' . $e->getMessage()]);
}
?>