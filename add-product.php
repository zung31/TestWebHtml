<?php
header('Content-Type: application/json');
require 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['intitule']) || !isset($input['descriptif']) || !isset($input['category_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit();
}
$intitule = trim($input['intitule']);
$descriptif = trim($input['descriptif']);
$category_id = intval($input['category_id']);

if (empty($intitule) || empty($descriptif) || $category_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data']);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO produits (intitule, descriptif, category_id, created, modified) VALUES (:intitule, :descriptif, :category_id, NOW(), NOW())");
    $stmt->bindParam(':intitule', $intitule, PDO::PARAM_STR);
    $stmt->bindParam(':descriptif', $descriptif, PDO::PARAM_STR);
    $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt->execute();
    $productId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'productId' => $productId]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error adding product: ' . $e->getMessage()]);
}