<?php
header('Content-Type: application/json');

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$categoryId = $data['id'];

try {
    $pdo->beginTransaction();
    $deleteProductsQuery = "DELETE FROM produits WHERE category_id = :id";
    $deleteProductsStmt = $pdo->prepare($deleteProductsQuery);
    $deleteProductsStmt->execute([
        ':id' => $categoryId,
    ]);
    $query = "DELETE FROM categories WHERE id = :id OR parent_id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':id' => $categoryId,
    ]);
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression de la catégorie: ' . $e->getMessage()]);
}
?>