<?php
header('Content-Type: application/json');

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$categoryId = $data['id'];
$newIntitule = $data['intitule'];

try {
    $query = "UPDATE categories SET intitule = :intitule WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':intitule' => $newIntitule,
        ':id' => $categoryId,
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour de la catégorie: ' . $e->getMessage()]);
}
?>